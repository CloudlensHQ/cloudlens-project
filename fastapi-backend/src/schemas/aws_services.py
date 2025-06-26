from datetime import datetime
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field
from enum import Enum


class EBSVolumeState(str, Enum):
    """EBS Volume states"""
    CREATING = "creating"
    AVAILABLE = "available"
    IN_USE = "in-use"
    DELETING = "deleting"
    DELETED = "deleted"
    ERROR = "error"


class EBSVolume(BaseModel):
    """EBS Volume schema based on real AWS scan data"""
    VolumeId: str = Field(..., description="Unique identifier for the EBS volume")
    Size: int = Field(..., description="Size of the volume in GB")
    State: str = Field(..., description="Current state of the volume")
    Encrypted: bool = Field(..., description="Whether the volume is encrypted")
    CreateTime: datetime = Field(..., description="When the volume was created")
    VolumeName: str = Field(..., description="Name/tag of the volume")
    AttachedInstanceId: Optional[str] = Field(None, description="ID of the attached EC2 instance")


class EC2InstanceState(str, Enum):
    """EC2 Instance states"""
    PENDING = "pending"
    RUNNING = "running"
    SHUTTING_DOWN = "shutting-down"
    TERMINATED = "terminated"
    STOPPING = "stopping"
    STOPPED = "stopped"


class EC2Instance(BaseModel):
    """EC2 Instance schema based on real AWS scan data"""
    InstanceId: str = Field(..., description="Unique identifier for the EC2 instance")
    State: str = Field(..., description="Current state of the instance")
    IMDSVersion: str = Field(..., description="Instance Metadata Service version")
    InstanceName: str = Field(..., description="Name of the instance")
    PublicIpAddress: str = Field(..., description="Public IP address or 'N/A'")
    PrivateIpAddress: str = Field(..., description="Private IP address")


class PublicAccessBlockConfiguration(BaseModel):
    """S3 Public Access Block Configuration"""
    BlockPublicAcls: bool = Field(..., description="Block public ACLs")
    IgnorePublicAcls: bool = Field(..., description="Ignore public ACLs")
    BlockPublicPolicy: bool = Field(..., description="Block public bucket policies")
    RestrictPublicBuckets: bool = Field(..., description="Restrict public buckets")


class S3Bucket(BaseModel):
    """S3 Bucket schema based on real AWS scan data"""
    Region: str = Field(..., description="AWS region where bucket is located")
    BucketName: str = Field(..., description="Name of the S3 bucket")
    CreationDate: datetime = Field(..., description="When the bucket was created")
    EncryptionEnabled: bool = Field(..., description="Whether the bucket has encryption enabled")
    VersioningEnabled: bool = Field(..., description="Whether versioning is enabled")
    PublicAccessBlockConfiguration: Union[PublicAccessBlockConfiguration, str] = Field(
        ..., description="Public access block configuration or 'Not configured'"
    )


class RiskyInboundRule(BaseModel):
    """Risky inbound rule in security group"""
    source: str = Field(..., description="Source IP or CIDR")
    protocol: str = Field(..., description="Protocol (tcp, udp, icmp)")
    port_range: str = Field(..., description="Port range")


class SecurityGroup(BaseModel):
    """Security Group schema based on real AWS scan data"""
    VpcId: str = Field(..., description="VPC ID where security group is located")
    GroupId: str = Field(..., description="Security group ID")
    GroupName: str = Field(..., description="Security group name")
    Description: str = Field(..., description="Security group description")
    InboundRuleCount: int = Field(..., description="Number of inbound rules")
    OutboundRuleCount: int = Field(..., description="Number of outbound rules")
    RiskyInboundRules: List[RiskyInboundRule] = Field(default_factory=list, description="Risky inbound rules")


class KMSKey(BaseModel):
    """KMS Key schema based on real AWS scan data"""
    KeyId: str = Field(..., description="KMS key ID")
    KeyArn: str = Field(..., description="KMS key ARN")
    Origin: str = Field(..., description="Key origin (AWS_KMS, EXTERNAL, etc.)")
    KeyState: str = Field(..., description="Current state of the key")
    KeyUsage: str = Field(..., description="Key usage (ENCRYPT_DECRYPT, etc.)")
    CreationDate: datetime = Field(..., description="When the key was created")
    RotationEnabled: bool = Field(..., description="Whether key rotation is enabled")


# Container classes for scan results
class EBSVolumesScanResult(BaseModel):
    """EBS volumes scan result"""
    EBSVolumes: List[EBSVolume] = Field(default_factory=list, description="List of EBS volumes")


class EC2InstancesScanResult(BaseModel):
    """EC2 instances scan result"""
    EC2Instances: List[EC2Instance] = Field(default_factory=list, description="List of EC2 instances")


class S3BucketsScanResult(BaseModel):
    """S3 buckets scan result"""
    S3Buckets: List[S3Bucket] = Field(default_factory=list, description="List of S3 buckets")


class SecurityGroupsScanResult(BaseModel):
    """Security groups scan result"""
    SecurityGroups: List[SecurityGroup] = Field(default_factory=list, description="List of security groups")


class KMSKeysScanResult(BaseModel):
    """KMS keys scan result"""
    KMSKeys: List[KMSKey] = Field(default_factory=list, description="List of KMS keys")


class RDSDatabasesScanResult(BaseModel):
    """RDS databases scan result"""
    RDSDatabases: List[Dict[str, Any]] = Field(default_factory=list, description="List of RDS databases")


# Complete scan result that can contain any combination of services
class AWSServicesScanResult(BaseModel):
    """Complete AWS services scan result"""
    EBSVolumes: Optional[List[EBSVolume]] = Field(None, description="EBS volumes")
    EC2Instances: Optional[List[EC2Instance]] = Field(None, description="EC2 instances")
    S3Buckets: Optional[List[S3Bucket]] = Field(None, description="S3 buckets")
    SecurityGroups: Optional[List[SecurityGroup]] = Field(None, description="Security groups")
    KMSKeys: Optional[List[KMSKey]] = Field(None, description="KMS keys")
    RDSDatabases: Optional[List[Dict[str, Any]]] = Field(None, description="RDS databases")
    
    # Metadata
    scan_timestamp: Optional[datetime] = Field(None, description="When the scan was performed")
    region: Optional[str] = Field(None, description="AWS region that was scanned")
    account_id: Optional[str] = Field(None, description="AWS account ID")
    note: Optional[str] = Field(None, description="Scan notes or messages")