import boto3
import json
import uuid
from datetime import datetime
import traceback
from typing import Dict, List, Optional, Any
from botocore.exceptions import ClientError, BotoCoreError

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from dbschema.db_connector import get_db
from dbschema.model import CloudScan, ServiceScanResult, Tenant

# Configure basic print statements for Lambda logging
def log_info(message):
    print(f"INFO: {message}")

def log_error(message):
    print(f"ERROR: {message}")

def get_instance_name(tags: Optional[List]) -> str:
    """
    Extract the Name tag value from a list of AWS resource tags
    
    Args:
        tags (Optional[List]): List of AWS resource tags
        
    Returns:
        str: The value of the Name tag, or "Unnamed Instance" if not found
    """
    if not tags:
        return "Unnamed Instance"
    for tag in tags:
        if tag['Key'] == 'Name':
            return tag['Value']
    return "Unnamed Instance"

# Non-async functions for EC2 instance checking
def check_ec2_instances(ec2_client) -> Dict:
    """
    Retrieve and analyze security configurations for all EC2 instances
    """
    instances = []
    paginator = ec2_client.get_paginator('describe_instances')
    
    try:
        for page in paginator.paginate():
            for reservation in page['Reservations']:
                for instance in reservation['Instances']:
                    instance_name = get_instance_name(instance.get('Tags', []))
                    instances.append({
                        'InstanceId': instance['InstanceId'],
                        'InstanceName': instance_name,
                        'PrivateIpAddress': instance.get('PrivateIpAddress', 'N/A'),
                        'PublicIpAddress': instance.get('PublicIpAddress', 'N/A'),
                        'State': instance['State']['Name'],
                        'IMDSVersion': 'IMDSv2' if instance.get('MetadataOptions', {}).get('HttpTokens') == 'required' else 'IMDSv1'
                    })
                    
        log_info(f"Successfully retrieved information for {len(instances)} EC2 instances")
        return {'EC2Instances': instances}
    except Exception as e:
        log_error(f"Error checking EC2 instances: {str(e)}")
        raise

# Non-async functions for EBS volume checking
def check_ebs_volumes(ec2_client) -> Dict:
    """Retrieve and analyze security configurations for all EBS volumes"""
    volumes = []
    paginator = ec2_client.get_paginator('describe_volumes')
    
    try:
        for page in paginator.paginate():
            for volume in page['Volumes']:
                volume_name = get_instance_name(volume.get('Tags', []))
                volumes.append({
                    'VolumeId': volume['VolumeId'],
                    'VolumeName': volume_name,
                    'CreateTime': volume['CreateTime'].isoformat(),
                    'Size': volume['Size'],
                    'State': volume['State'],
                    'Encrypted': volume['Encrypted'],
                    'AttachedInstanceId': volume['Attachments'][0]['InstanceId'] if volume['Attachments'] else None
                })
                
        log_info(f"Successfully retrieved information for {len(volumes)} EBS volumes")
        return {'EBSVolumes': volumes}
    except Exception as e:
        log_error(f"Error checking EBS volumes: {str(e)}")
        raise

# Non-async functions for S3 bucket checking
def check_s3_buckets(s3_client) -> Dict:
    """Check S3 buckets and their security configurations"""
    buckets = []
    
    try:
        for bucket in s3_client.list_buckets()['Buckets']:
            try:
                bucket_name = bucket['Name']
                
                # Get bucket location
                location = s3_client.get_bucket_location(Bucket=bucket_name)
                region = location['LocationConstraint'] or 'us-east-1'
                
                # Get bucket versioning
                versioning = s3_client.get_bucket_versioning(Bucket=bucket_name)
                versioning_status = versioning.get('Status', 'NotEnabled')
                
                # Get bucket encryption
                try:
                    encryption = s3_client.get_bucket_encryption(Bucket=bucket_name)
                    encryption_enabled = True
                except ClientError as e:
                    if e.response['Error']['Code'] == 'ServerSideEncryptionConfigurationNotFoundError':
                        encryption_enabled = False
                    else:
                        raise
                
                # Get public access block configuration
                try:
                    public_access_block = s3_client.get_public_access_block(Bucket=bucket_name)
                    public_access_config = public_access_block['PublicAccessBlockConfiguration']
                except ClientError:
                    public_access_config = "Not configured"
                
                buckets.append({
                    'BucketName': bucket_name,
                    'CreationDate': bucket['CreationDate'].isoformat(),
                    'Region': region,
                    'VersioningEnabled': versioning_status == 'Enabled',
                    'EncryptionEnabled': encryption_enabled,
                    'PublicAccessBlockConfiguration': public_access_config
                })
                
            except ClientError as e:
                log_error(f"Error checking bucket {bucket_name}: {str(e)}")

        log_info(f"Successfully retrieved information for {len(buckets)} S3 buckets")
        return {'S3Buckets': buckets}
    except Exception as e:
        log_error(f"Error checking S3 buckets: {str(e)}")
        raise

def check_security_groups(ec2_client) -> Dict:
    """Check security groups for overly permissive rules"""
    security_groups = []
    paginator = ec2_client.get_paginator('describe_security_groups')
    
    try:
        for page in paginator.paginate():
            for sg in page['SecurityGroups']:
                # Check for problematic inbound rules
                risky_inbound_rules = []
                for rule in sg.get('IpPermissions', []):
                    for ip_range in rule.get('IpRanges', []):
                        if ip_range.get('CidrIp') == '0.0.0.0/0':
                            risky_inbound_rules.append({
                                'protocol': rule.get('IpProtocol'),
                                'port_range': f"{rule.get('FromPort', 'All')}-{rule.get('ToPort', 'All')}",
                                'source': '0.0.0.0/0'
                            })
                
                security_groups.append({
                    'GroupId': sg['GroupId'],
                    'GroupName': sg['GroupName'],
                    'Description': sg['Description'],
                    'VpcId': sg.get('VpcId', 'Default'),
                    'RiskyInboundRules': risky_inbound_rules,
                    'InboundRuleCount': len(sg.get('IpPermissions', [])),
                    'OutboundRuleCount': len(sg.get('IpPermissionsEgress', [])),
                })
                
        log_info(f"Successfully retrieved information for {len(security_groups)} security groups")
        return {'SecurityGroups': security_groups}
    except Exception as e:
        log_error(f"Error checking security groups: {str(e)}")
        raise

def check_rds_databases(rds_client) -> Dict:
    """Check RDS database instances for security configurations"""
    databases = []
    paginator = rds_client.get_paginator('describe_db_instances')
    
    try:
        for page in paginator.paginate():
            for db in page['DBInstances']:
                databases.append({
                    'DBInstanceId': db['DBInstanceIdentifier'],
                    'Engine': db['Engine'],
                    'EngineVersion': db['EngineVersion'],
                    'StorageEncrypted': db.get('StorageEncrypted', False),
                    'PubliclyAccessible': db['PubliclyAccessible'],
                    'MultiAZ': db['MultiAZ'],
                    'DeletionProtection': db.get('DeletionProtection', False),
                    'BackupRetentionPeriod': db['BackupRetentionPeriod'],
                    'VpcId': db.get('DBSubnetGroup', {}).get('VpcId', 'N/A'),
                })
                
        log_info(f"Successfully retrieved information for {len(databases)} RDS databases")
        return {'RDSDatabases': databases}
    except Exception as e:
        log_error(f"Error checking RDS databases: {str(e)}")
        raise

def check_kms_keys(kms_client) -> Dict:
    """Check KMS keys for rotation and usage"""
    keys = []
    paginator = kms_client.get_paginator('list_keys')
    
    try:
        for page in paginator.paginate():
            for key in page['Keys']:
                key_id = key['KeyId']
                try:
                    # Get detailed information about the key
                    key_info = kms_client.describe_key(KeyId=key_id)
                    
                    # Skip keys not managed by the account (AWS managed keys)
                    if key_info['KeyMetadata']['KeyManager'] != 'CUSTOMER':
                        continue
                        
                    # Get key rotation status (only works for customer managed CMKs)
                    try:
                        rotation = kms_client.get_key_rotation_status(KeyId=key_id)
                        key_rotation_enabled = rotation.get('KeyRotationEnabled', False)
                    except ClientError:
                        key_rotation_enabled = "Unable to determine"
                    
                    keys.append({
                        'KeyId': key_id,
                        'KeyArn': key['KeyArn'],
                        'KeyState': key_info['KeyMetadata']['KeyState'],
                        'KeyUsage': key_info['KeyMetadata']['KeyUsage'],
                        'Origin': key_info['KeyMetadata']['Origin'],
                        'RotationEnabled': key_rotation_enabled,
                        'CreationDate': key_info['KeyMetadata']['CreationDate'].isoformat() if 'CreationDate' in key_info['KeyMetadata'] else None
                    })
                except ClientError as e:
                    log_error(f"Error accessing KMS key {key_id}: {str(e)}")
                
        log_info(f"Successfully retrieved information for {len(keys)} KMS customer managed keys")
        return {'KMSKeys': keys}
    except Exception as e:
        log_error(f"Error checking KMS keys: {str(e)}")
        raise

def check_iam_users(iam_client) -> Dict:
    """Check IAM users for security best practices"""
    users = []
    paginator = iam_client.get_paginator('list_users')
    
    try:
        for page in paginator.paginate():
            for user in page['Users']:
                user_name = user['UserName']
                
                # Check MFA status
                try:
                    mfa_devices = iam_client.list_mfa_devices(UserName=user_name)
                    has_mfa = len(mfa_devices['MFADevices']) > 0
                except ClientError as e:
                    log_error(f"Error checking MFA for user {user_name}: {str(e)}")
                    has_mfa = "Unknown"
                
                # Check for access keys
                try:
                    access_keys = iam_client.list_access_keys(UserName=user_name)
                    active_keys = sum(1 for key in access_keys['AccessKeyMetadata'] 
                                     if key['Status'] == 'Active')
                except ClientError as e:
                    log_error(f"Error checking access keys for user {user_name}: {str(e)}")
                    active_keys = "Unknown"
                
                users.append({
                    'UserName': user_name,
                    'UserId': user['UserId'],
                    'ARN': user['Arn'],
                    'CreateDate': user['CreateDate'].isoformat(),
                    'PasswordLastUsed': user.get('PasswordLastUsed', 'Never').isoformat() 
                                        if user.get('PasswordLastUsed') else 'Never',
                    'HasMFA': has_mfa,
                    'ActiveAccessKeys': active_keys,
                })
                
        log_info(f"Successfully retrieved information for {len(users)} IAM users")
        return {'IAMUsers': users}
    except Exception as e:
        log_error(f"Error checking IAM users: {str(e)}")
        raise

def initialize_aws_client(aws_access_key, aws_secret_key, region='us-east-1', service='ec2', aws_session_token=None):
    """Initialize a specific AWS service client"""
    try:
        session_params = {
            'aws_access_key_id': aws_access_key,
            'aws_secret_access_key': aws_secret_key,
            'region_name': region
        }
        
        # Add session token if provided (for temporary credentials)
        if aws_session_token:
            session_params['aws_session_token'] = aws_session_token
            
        session = boto3.Session(**session_params)
        return session.client(service)
    except Exception as e:
        log_error(f"Failed to initialize AWS {service} client: {str(e)}")
        raise

def scan_region(aws_access_key, aws_secret_key, region, aws_session_token=None):
    """Scan a single AWS region for resources"""
    log_info(f"Scanning resources in region: {region}")
    
    try:
        # Initialize service clients
        ec2_client = initialize_aws_client(aws_access_key, aws_secret_key, region, 'ec2', aws_session_token)
        s3_client = initialize_aws_client(aws_access_key, aws_secret_key, region, 's3', aws_session_token)
        rds_client = initialize_aws_client(aws_access_key, aws_secret_key, region, 'rds', aws_session_token)
        kms_client = initialize_aws_client(aws_access_key, aws_secret_key, region, 'kms', aws_session_token)
        
        # IAM is a global service, so region doesn't matter for IAM client
        iam_client = initialize_aws_client(aws_access_key, aws_secret_key, 'us-east-1', 'iam', aws_session_token)
        
        # Run scans sequentially (no async)
        ec2_results = check_ec2_instances(ec2_client)
        ebs_results = check_ebs_volumes(ec2_client)
        s3_results = check_s3_buckets(s3_client)
        sg_results = check_security_groups(ec2_client)
        rds_results = check_rds_databases(rds_client)
        kms_results = check_kms_keys(kms_client)
        
        # Only scan IAM in one region since it's global
        iam_results = {}
        if region == 'us-east-1':
            iam_results = check_iam_users(iam_client)
        
        return {
            'ec2': ec2_results,
            'ebs': ebs_results,
            's3': s3_results,
            'security_groups': sg_results,
            'rds': rds_results,
            'kms': kms_results,
            'iam': iam_results if region == 'us-east-1' else {'note': 'IAM is a global service scanned in us-east-1 only'},
            'region': region
        }
    except Exception as e:
        log_error(f"Error scanning region {region}: {str(e)}")
        return {
            'region': region,
            'error': str(e)
        }

def extract_credentials(event):
    """Extract AWS credentials from SNS event message"""
    try:
        # Check if this is from SNS
        if 'Records' in event and len(event['Records']) > 0:
            message = json.loads(event['Records'][0]['Sns']['Message'])
        else:
            # Direct invocation
            message = event
        
        # Extract required credentials
        aws_access_key = message.get('aws_access_key_id')
        aws_secret_key = message.get('aws_secret_access_key')
        aws_session_token = message.get('aws_session_token')  # Extract optional session token
        tenant_id = message.get('tenant_id')
        
        # Extract optional region exclusion list
        excluded_regions = message.get('excluded_regions', [])
        scan_options = message.get('scan_options', {})
        
        if not aws_access_key or not aws_secret_key:
            raise ValueError("Missing required AWS credentials in the message")
        
        return aws_access_key, aws_secret_key, aws_session_token, tenant_id, excluded_regions, scan_options
    except Exception as e:
        log_error(f"Failed to extract credentials: {str(e)}")
        raise

def save_scan_results_to_db(tenant_id, scan_results):
    """Save scan results to database"""
    try:
        with get_db(application_name='lambda-save-scan') as db:
            # Create a new cloud scan record
            cloud_scan = CloudScan(
                id=uuid.uuid4(),
                created_by=tenant_id,
                name="AWS Security Scan",
                status="COMPLETED",  # Fixed: Now using uppercase for enum value
                cloud_provider="AWS",  # Fixed: Use uppercase for the cloud_provider enum
                cloud_scan_metadata={
                    "total_regions_scanned": len(scan_results),
                    "scan_timestamp": datetime.now().isoformat()
                }
            )
            db.add(cloud_scan)
            db.flush()  # Flush to get the ID without committing
            
            scan_id = cloud_scan.id
            
            # Create service scan results
            for region, region_results in scan_results.items():
                for service_name, service_data in region_results.items():
                    if service_name == 'region':
                        continue  # Skip the region name entry
                    
                    service_result = ServiceScanResult(
                        id=uuid.uuid4(),
                        scan_id=scan_id,
                        tenant_id=tenant_id,
                        service_name=service_name,
                        region=region,
                        service_scan_data=service_data,
                        scan_result_metadata={
                            "timestamp": datetime.now().isoformat(),
                            "service_type": service_name
                        }
                    )
                    db.add(service_result)
            
            # Commit all changes
            db.commit()
            log_info(f"Successfully saved scan results to database for scan ID: {scan_id}")
            
            return scan_id
    except Exception as e:
        log_error(f"Database error while saving scan results: {str(e)}\n{traceback.format_exc()}")
        raise

def process_scan_request(event):
    try:
        # Extract credentials from the event (updated function)
        aws_access_key, aws_secret_key, aws_session_token, tenant_id, excluded_regions, scan_options = extract_credentials(event)
        
        # Get list of ALL AWS regions
        ec2_client = initialize_aws_client(aws_access_key, aws_secret_key, service='ec2', aws_session_token=aws_session_token)
        all_regions = [region['RegionName'] for region in ec2_client.describe_regions()['Regions']]
        
        # Filter out excluded regions if any
        regions = [r for r in all_regions if r not in excluded_regions]
        
        log_info(f"Starting inventory scan across {len(regions)} AWS regions" + 
                (f" (excluding {len(excluded_regions)} regions)" if excluded_regions else ""))
        
        # Add timeout handling for very large accounts
        scan_timeout = scan_options.get('timeout_seconds', 840)  # 14 minutes default for Lambda
        start_time = datetime.now()
        
        # Scan regions one by one
        scan_results = {}
        for i, region in enumerate(regions):
            # Check if we're approaching timeout
            elapsed = (datetime.now() - start_time).total_seconds()
            if elapsed > scan_timeout - 60:  # Leave 1 minute buffer
                log_info(f"Approaching timeout limit. Processed {i}/{len(regions)} regions.")
                break
                
            log_info(f"Scanning region {i+1}/{len(regions)}: {region}")
            result = scan_region(aws_access_key, aws_secret_key, region, aws_session_token)
            scan_results[result['region']] = result
        
        # Save results to database
        scan_id = save_scan_results_to_db(tenant_id, scan_results)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Full AWS inventory scan completed successfully',
                'scan_id': str(scan_id),
                'regions_scanned': len(scan_results),
                'total_regions': len(regions),
                'timestamp': datetime.now().isoformat()
            })
        }
    except Exception as e:
        log_error(f"Error processing inventory scan: {str(e)}\n{traceback.format_exc()}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Failed to process inventory scan',
                'message': str(e)
            })
        }
    
def process_scan_request_v2(aws_access_key, aws_secret_key, aws_session_token, tenant_id, excluded_regions, scan_options: int = 840):
    try:
        # Get list of ALL AWS regions
        ec2_client = initialize_aws_client(aws_access_key, aws_secret_key, service='ec2', aws_session_token=aws_session_token)
        all_regions = [region['RegionName'] for region in ec2_client.describe_regions()['Regions']]
        
        # Filter out excluded regions if any
        regions = [r for r in all_regions if r not in excluded_regions]
        
        log_info(f"Starting inventory scan across {len(regions)} AWS regions" + 
                (f" (excluding {len(excluded_regions)} regions)" if excluded_regions else ""))
        
        # Add timeout handling for very large accounts
        scan_timeout = scan_options.get('timeout_seconds', 840)  # 14 minutes default for Lambda
        start_time = datetime.now()
        
        # Scan regions one by one
        scan_results = {}
        for i, region in enumerate(regions):
            # Check if we're approaching timeout
            elapsed = (datetime.now() - start_time).total_seconds()
            if elapsed > scan_timeout - 60:  # Leave 1 minute buffer
                log_info(f"Approaching timeout limit. Processed {i}/{len(regions)} regions.")
                break
                
            log_info(f"Scanning region {i+1}/{len(regions)}: {region}")
            result = scan_region(aws_access_key, aws_secret_key, region, aws_session_token)
            scan_results[result['region']] = result
        
        # Save results to database
        scan_id = save_scan_results_to_db(tenant_id, scan_results)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Full AWS inventory scan completed successfully',
                'scan_id': str(scan_id),
                'regions_scanned': len(scan_results),
                'total_regions': len(regions),
                'timestamp': datetime.now().isoformat()
            })
        }
    except Exception as e:
        log_error(f"Error processing inventory scan: {str(e)}\n{traceback.format_exc()}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Failed to process inventory scan',
                'message': str(e)
            })
        }

def lambda_handler(event, context):
    """Main Lambda handler function"""
    try:
        print(f"Received event: {json.dumps(event)}")
        
        # Check for inventory mode flag
        if event.get('scan_mode') == 'inventory':
            log_info("Running in inventory collection mode (scanning all regions)")
        
        return process_scan_request(event)
    except Exception as e:
        log_error(f"Lambda handler error: {str(e)}\n{traceback.format_exc()}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Lambda execution failed',
                'message': str(e)
            })
        }