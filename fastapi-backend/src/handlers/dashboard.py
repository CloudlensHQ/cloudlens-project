from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uuid
import json
from datetime import datetime
from collections import defaultdict, Counter
import logging

logger = logging.getLogger(__name__)

from dbschema.db_connector import get_db_session
from dbschema.model import CloudScan, ServiceScanResult
from ..schemas.dashboard import (
    DashboardResponse, 
    ScanOverview, 
    ServiceMetrics, 
    RegionMetrics, 
    SecurityMetrics,
    ResourceTrend,
    TopResource
)

api = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


class DashboardRequest(BaseModel):
    """Dashboard request model"""
    tenant_id: str
    scan_id: Optional[str] = None  # If provided, show data for specific scan
    days: Optional[int] = 30  # Number of days to look back for trends


@api.post("/metrics", response_model=DashboardResponse)
async def get_dashboard_metrics(
    request: DashboardRequest,
    db: Any = Depends(get_db_session)
):
    """
    Get comprehensive dashboard metrics for a tenant.
    
    Args:
        request: DashboardRequest containing tenant_id and optional filters
        db: Database connection
    
    Returns:
        DashboardResponse: Comprehensive dashboard metrics
    
    Raises:
        HTTPException: If data retrieval fails
    """
    try:
        logger.info(
            "Dashboard metrics request received",
            extra={
                "tenant_id": request.tenant_id,
                "scan_id": request.scan_id,
                "days": request.days
            }
        )
        
        # Get scans for the tenant
        scans_query = db.query(CloudScan).filter(
            CloudScan.tenant_id == request.tenant_id
        )
        
        if request.scan_id:
            # Get specific scan
            scans_query = scans_query.filter(CloudScan.id == uuid.UUID(request.scan_id))
        
        scans = scans_query.all()
        
        if not scans:
            logger.warning(
                "No scans found for tenant",
                extra={"tenant_id": request.tenant_id}
            )
            # Return empty dashboard
            return _create_empty_dashboard()
        
        # Get scan IDs for querying service results
        scan_ids = [scan.id for scan in scans]
        
        # Get all service scan results for these scans
        service_results = db.query(ServiceScanResult).filter(
            ServiceScanResult.scan_id.in_(scan_ids)
        ).all()
        
        logger.info(
            "Retrieved scan data",
            extra={
                "tenant_id": request.tenant_id,
                "total_scans": len(scans),
                "total_service_results": len(service_results)
            }
        )
        
        # Process data to create dashboard metrics
        dashboard_data = _process_scan_data(scans, service_results)
        
        logger.info(
            "Dashboard metrics processed successfully",
            extra={
                "tenant_id": request.tenant_id,
                "scan_id": request.scan_id
            }
        )
        
        return dashboard_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "Error retrieving dashboard metrics",
            extra={
                "error": str(e),
                "tenant_id": request.tenant_id,
                "scan_id": request.scan_id
            }
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving dashboard metrics: {str(e)}"
        )


def _process_scan_data(scans: List[CloudScan], service_results: List[ServiceScanResult]) -> DashboardResponse:
    """Process scan data and create dashboard metrics"""
    
    # Initialize counters
    service_counter = defaultdict(int)
    region_counter = defaultdict(int)
    service_regions = defaultdict(set)
    region_services = defaultdict(set)
    
    # Security metrics
    security_metrics = {
        'ec2_instances_running': 0,
        'ec2_instances_stopped': 0,
        'ec2_imds_v1_count': 0,
        'ec2_imds_v2_count': 0,
        's3_encrypted_buckets': 0,
        's3_unencrypted_buckets': 0,
        's3_public_buckets': 0,
        's3_private_buckets': 0,
        'ebs_encrypted_volumes': 0,
        'ebs_unencrypted_volumes': 0,
        'security_groups_with_risky_rules': 0,
        'rds_databases_count': 0,
        'kms_keys_count': 0
    }
    
    # Process service results
    top_resources = []
    alerts = []
    
    for result in service_results:
        service_name = result.service_name
        region = result.region or 'global'
        
        service_counter[service_name] += 1
        region_counter[region] += 1
        service_regions[service_name].add(region)
        region_services[region].add(service_name)
        
        # Process specific service data
        if result.service_scan_data:
            _process_service_specific_data(
                service_name, 
                result.service_scan_data, 
                security_metrics, 
                top_resources, 
                alerts,
                region
            )
    
    # Create scan overview
    scan_overview = ScanOverview(
        total_scans=len(scans),
        completed_scans=len([s for s in scans if s.status == 'COMPLETED']),
        failed_scans=len([s for s in scans if s.status == 'FAILED']),
        in_progress_scans=len([s for s in scans if s.status == 'RUNNING']),
        total_regions_scanned=len(region_counter),
        total_services_scanned=len(service_counter),
        last_scan_time=max([s.created_at for s in scans]) if scans else None
    )
    
    # Create service metrics
    service_metrics = [
        ServiceMetrics(
            service_name=service,
            resource_count=count,
            regions=list(service_regions[service]),
            last_scan_time=max([s.created_at for s in scans]) if scans else None
        )
        for service, count in service_counter.items()
    ]
    
    # Create region metrics
    region_metrics = [
        RegionMetrics(
            region=region,
            resource_count=count,
            services=list(region_services[region])
        )
        for region, count in region_counter.items()
    ]
    
    # Create security metrics
    security_metrics_obj = SecurityMetrics(**security_metrics)
    
    # Create resource trends (simplified for now)
    resource_trends = [
        ResourceTrend(
            date=datetime.now().strftime('%Y-%m-%d'),
            ec2_count=security_metrics['ec2_instances_running'] + security_metrics['ec2_instances_stopped'],
            s3_count=security_metrics['s3_encrypted_buckets'] + security_metrics['s3_unencrypted_buckets'],
            rds_count=security_metrics['rds_databases_count'],
            ebs_count=security_metrics['ebs_encrypted_volumes'] + security_metrics['ebs_unencrypted_volumes']
        )
    ]
    
    # Create scan history
    scan_history = [
        {
            "scan_id": str(scan.id),
            "name": scan.name,
            "status": scan.status,
            "created_at": scan.created_at.isoformat() if scan.created_at else None,
            "cloud_provider": scan.cloud_provider,
            "metadata": scan.cloud_scan_metadata
        }
        for scan in scans
    ]
    
    return DashboardResponse(
        scan_overview=scan_overview,
        service_metrics=service_metrics,
        region_metrics=region_metrics,
        security_metrics=security_metrics_obj,
        resource_trends=resource_trends,
        top_resources=top_resources[:10],  # Top 10 resources
        scan_history=scan_history,
        alerts=alerts
    )


def _process_service_specific_data(
    service_name: str,
    service_data: Dict[str, Any],
    security_metrics: Dict[str, int],
    top_resources: List[TopResource],
    alerts: List[Dict[str, Any]],
    region: str
):
    """Process specific service data for metrics"""
    
    if service_name == 'ec2' and 'EC2Instances' in service_data:
        for instance in service_data['EC2Instances']:
            # Count instance states
            if instance.get('State') == 'running':
                security_metrics['ec2_instances_running'] += 1
            elif instance.get('State') == 'stopped':
                security_metrics['ec2_instances_stopped'] += 1
            
            # Count IMDS versions
            if instance.get('IMDSVersion') == 'IMDSv1':
                security_metrics['ec2_imds_v1_count'] += 1
                # Add alert for IMDSv1
                alerts.append({
                    'type': 'security',
                    'severity': 'medium',
                    'message': f"EC2 instance {instance.get('InstanceId', 'unknown')} is using IMDSv1",
                    'resource': instance.get('InstanceId', 'unknown'),
                    'region': region
                })
            elif instance.get('IMDSVersion') == 'IMDSv2':
                security_metrics['ec2_imds_v2_count'] += 1
            
            # Add to top resources
            top_resources.append(TopResource(
                name=instance.get('InstanceName', 'Unnamed Instance'),
                type='EC2 Instance',
                region=region,
                risk_score=10 if instance.get('IMDSVersion') == 'IMDSv1' else 5,
                status=instance.get('State', 'unknown')
            ))
    
    elif service_name == 's3' and 'S3Buckets' in service_data:
        for bucket in service_data['S3Buckets']:
            # Count encryption status
            if bucket.get('EncryptionEnabled', False):
                security_metrics['s3_encrypted_buckets'] += 1
            else:
                security_metrics['s3_unencrypted_buckets'] += 1
                # Add alert for unencrypted bucket
                alerts.append({
                    'type': 'security',
                    'severity': 'high',
                    'message': f"S3 bucket {bucket.get('BucketName', 'unknown')} is not encrypted",
                    'resource': bucket.get('BucketName', 'unknown'),
                    'region': bucket.get('Region', 'unknown')
                })
            
            # Check public access
            public_access = bucket.get('PublicAccessBlockConfiguration')
            if public_access == 'Not configured' or (
                isinstance(public_access, dict) and 
                not all([
                    public_access.get('BlockPublicAcls', False),
                    public_access.get('IgnorePublicAcls', False),
                    public_access.get('BlockPublicPolicy', False),
                    public_access.get('RestrictPublicBuckets', False)
                ])
            ):
                security_metrics['s3_public_buckets'] += 1
                # Add alert for public bucket
                alerts.append({
                    'type': 'security',
                    'severity': 'critical',
                    'message': f"S3 bucket {bucket.get('BucketName', 'unknown')} may be publicly accessible",
                    'resource': bucket.get('BucketName', 'unknown'),
                    'region': bucket.get('Region', 'unknown')
                })
            else:
                security_metrics['s3_private_buckets'] += 1
            
            # Add to top resources
            risk_score = 0
            if not bucket.get('EncryptionEnabled', False):
                risk_score += 15
            if public_access == 'Not configured':
                risk_score += 20
            
            top_resources.append(TopResource(
                name=bucket.get('BucketName', 'Unknown Bucket'),
                type='S3 Bucket',
                region=bucket.get('Region', 'unknown'),
                risk_score=risk_score,
                status='active'
            ))
    
    elif service_name == 'ebs' and 'EBSVolumes' in service_data:
        for volume in service_data['EBSVolumes']:
            # Count encryption status
            if volume.get('Encrypted', False):
                security_metrics['ebs_encrypted_volumes'] += 1
            else:
                security_metrics['ebs_unencrypted_volumes'] += 1
                # Add alert for unencrypted volume
                alerts.append({
                    'type': 'security',
                    'severity': 'medium',
                    'message': f"EBS volume {volume.get('VolumeId', 'unknown')} is not encrypted",
                    'resource': volume.get('VolumeId', 'unknown'),
                    'region': region
                })
            
            # Add to top resources
            top_resources.append(TopResource(
                name=volume.get('VolumeName', 'Unnamed Volume'),
                type='EBS Volume',
                region=region,
                risk_score=10 if not volume.get('Encrypted', False) else 2,
                status=volume.get('State', 'unknown')
            ))
    
    elif service_name == 'security_groups' and 'SecurityGroups' in service_data:
        for sg in service_data['SecurityGroups']:
            # Count security groups with risky rules
            if sg.get('RiskyInboundRules'):
                security_metrics['security_groups_with_risky_rules'] += 1
                # Add alert for risky rules
                alerts.append({
                    'type': 'security',
                    'severity': 'high',
                    'message': f"Security group {sg.get('GroupId', 'unknown')} has risky inbound rules",
                    'resource': sg.get('GroupId', 'unknown'),
                    'region': region
                })
    
    elif service_name == 'rds' and 'RDSDatabases' in service_data:
        security_metrics['rds_databases_count'] += len(service_data['RDSDatabases'])
    
    elif service_name == 'kms' and 'KMSKeys' in service_data:
        security_metrics['kms_keys_count'] += len(service_data['KMSKeys'])


def _create_empty_dashboard() -> DashboardResponse:
    """Create an empty dashboard response"""
    return DashboardResponse(
        scan_overview=ScanOverview(
            total_scans=0,
            completed_scans=0,
            failed_scans=0,
            in_progress_scans=0,
            total_regions_scanned=0,
            total_services_scanned=0,
            last_scan_time=None
        ),
        service_metrics=[],
        region_metrics=[],
        security_metrics=SecurityMetrics(
            ec2_instances_running=0,
            ec2_instances_stopped=0,
            ec2_imds_v1_count=0,
            ec2_imds_v2_count=0,
            s3_encrypted_buckets=0,
            s3_unencrypted_buckets=0,
            s3_public_buckets=0,
            s3_private_buckets=0,
            ebs_encrypted_volumes=0,
            ebs_unencrypted_volumes=0,
            security_groups_with_risky_rules=0,
            rds_databases_count=0,
            kms_keys_count=0
        ),
        resource_trends=[],
        top_resources=[],
        scan_history=[],
        alerts=[]
    ) 
