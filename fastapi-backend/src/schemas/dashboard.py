from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime


class ServiceMetrics(BaseModel):
    service_name: str
    resource_count: int
    regions: List[str]
    last_scan_time: Optional[datetime] = None


class RegionMetrics(BaseModel):
    region: str
    resource_count: int
    services: List[str]


class SecurityMetrics(BaseModel):
    ec2_instances_running: int
    ec2_instances_stopped: int
    ec2_imds_v1_count: int
    ec2_imds_v2_count: int
    s3_encrypted_buckets: int
    s3_unencrypted_buckets: int
    s3_public_buckets: int
    s3_private_buckets: int
    ebs_encrypted_volumes: int
    ebs_unencrypted_volumes: int
    security_groups_with_risky_rules: int
    rds_databases_count: int
    kms_keys_count: int


class ScanOverview(BaseModel):
    total_scans: int
    completed_scans: int
    failed_scans: int
    in_progress_scans: int
    total_regions_scanned: int
    total_services_scanned: int
    last_scan_time: Optional[datetime] = None


class ResourceTrend(BaseModel):
    date: str
    ec2_count: int
    s3_count: int
    rds_count: int
    ebs_count: int


class TopResource(BaseModel):
    name: str
    type: str
    region: str
    risk_score: Optional[int] = None
    status: str


class DashboardResponse(BaseModel):
    scan_overview: ScanOverview
    service_metrics: List[ServiceMetrics]
    region_metrics: List[RegionMetrics]
    security_metrics: SecurityMetrics
    resource_trends: List[ResourceTrend]
    top_resources: List[TopResource]
    scan_history: List[Dict[str, Any]]
    alerts: List[Dict[str, Any]] 