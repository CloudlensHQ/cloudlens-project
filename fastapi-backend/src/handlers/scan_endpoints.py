from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Tuple
import uuid
import json
from datetime import datetime

import logging

logger = logging.getLogger(__name__)


from dbschema.db_connector import get_db_session
from dbschema.model import CloudScan, ServiceScanResult, User, Tenant
from src.middleware.auth import get_tenant_scoped_context, get_current_context, TenantContext
from src.jobs.aws_cloud_scan import process_scan_request_v2
from src.encryption import EncryptionService

# Initialize encryption service
encryption_service = EncryptionService()

api = APIRouter(prefix="/api/scan", tags=["AWS Scanning"])

class AWSCloudScanRequest(BaseModel):
    """AWS Cloud Scan Request with encrypted credentials"""
    encrypted_aws_access_key: str
    encrypted_aws_secret_key: str
    encrypted_aws_session_token: Optional[str] = None
    excluded_regions: Optional[List[str]] = None
    scan_options: Optional[int] = 840

class ScanResponse(BaseModel):
    """Scan response model"""
    scan_id: str
    message: str
    status: str
    timestamp: str
    tenant_id: str

class ScanListResponse(BaseModel):
    """Scan list response model"""
    scan_id: str
    name: Optional[str]
    status: Optional[str]
    cloud_provider: Optional[str]
    created_by: Optional[str]
    metadata: Optional[Dict[str, Any]]
    created_at: Optional[str]
    updated_at: Optional[str]

    class Config:
        from_attributes = True

class ScanListRequest(BaseModel):
    status: Optional[str] = None
    cloud_provider: Optional[str] = None
    limit: Optional[int] = 50
    offset: Optional[int] = 0

class ServiceScanRequest(BaseModel):
    scan_id: str
    service_name: str
    region: Optional[str] = None

class ServiceScanResponse(BaseModel):
    """Service scan result response model"""
    id: str
    scan_id: str
    service_name: Optional[str]
    region: Optional[str]
    scan_result_metadata: Optional[Dict[str, Any]]
    service_scan_data: Optional[Dict[str, Any]]
    created_at: Optional[str]
    updated_at: Optional[str]
    tenant_id: Optional[str]

    class Config:
        from_attributes = True

@api.post("/aws-cloud-scan", response_model=ScanResponse)
async def aws_cloud_scan(
    request: AWSCloudScanRequest,
    background_tasks: BackgroundTasks,
    context: TenantContext = Depends(get_current_context),
    db: Any = Depends(get_db_session)
):
    """
    Initiate an AWS cloud security scan with encrypted credentials.
    
    This endpoint accepts encrypted AWS credentials and initiates a comprehensive
    security scan across the specified AWS account. The scan is automatically
    scoped to the authenticated user's tenant.
    
    Args:
        request: The scan request containing encrypted AWS credentials and configuration
        background_tasks: FastAPI background tasks for async processing
        context: Authenticated user and tenant context
        db: Database connection
    
    Returns:
        ScanResponse: Contains scan ID, status, and other metadata
    
    Raises:
        HTTPException: If credentials are invalid or scan initialization fails
    """
    # Generate unique scan ID for tracking
    scan_id = str(uuid.uuid4())
    
    # Log incoming request (without sensitive data)
    logger.info(
        "AWS scan request received",
        extra={
            "scan_id": scan_id,
            "tenant_id": str(context.tenant_id),
            "user_id": str(context.user_id),
            "excluded_regions_count": len(request.excluded_regions or []),
            "scan_options": request.scan_options,
            "has_session_token": bool(request.encrypted_aws_session_token)
        }
    )
    
    try:
        # Decrypt AWS credentials
        logger.info("Starting credential decryption", extra={"scan_id": scan_id})
        
        try:
            aws_access_key = encryption_service.decrypt(request.encrypted_aws_access_key)
            aws_secret_key = encryption_service.decrypt(request.encrypted_aws_secret_key)
            aws_session_token = None
            
            if request.encrypted_aws_session_token:
                aws_session_token = encryption_service.decrypt(request.encrypted_aws_session_token)
            
            logger.info(
                "Credentials decrypted successfully", 
                extra={
                    "scan_id": scan_id,
                    "has_access_key": bool(aws_access_key),
                    "has_secret_key": bool(aws_secret_key),
                    "has_session_token": bool(aws_session_token)
                }
            )
            
        except Exception as e:
            logger.error(
                "Failed to decrypt AWS credentials",
                extra={
                    "scan_id": scan_id,
                    "error": str(e),
                    "tenant_id": str(context.tenant_id)
                }
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to decrypt AWS credentials: {str(e)}"
            )
        
        # Validate that decrypted credentials are not empty
        if not aws_access_key or not aws_secret_key:
            logger.error(
                "Invalid credentials after decryption",
                extra={
                    "scan_id": scan_id,
                    "has_access_key": bool(aws_access_key),
                    "has_secret_key": bool(aws_secret_key)
                }
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="AWS access key and secret key are required"
            )
        
        # Create initial scan record in database
        logger.info("Creating scan record in database", extra={"scan_id": scan_id})
        
        try:
            cloud_scan = CloudScan(
                id=uuid.UUID(scan_id),
                created_by=context.tenant_id,
                name="AWS Security Scan",
                status="RUNNING",
                cloud_provider="AWS",
                cloud_scan_metadata={
                    "scan_options": request.scan_options,
                    "excluded_regions": request.excluded_regions or [],
                    "start_timestamp": datetime.now().isoformat()
                }
            )
            db.add(cloud_scan)
            db.commit()
            
            logger.info(
                "Scan record created successfully",
                extra={
                    "scan_id": scan_id,
                    "tenant_id": str(context.tenant_id),
                    "cloud_provider": "AWS"
                }
            )
            
        except Exception as e:
            logger.error(
                "Failed to create scan record in database",
                extra={
                    "scan_id": scan_id,
                    "error": str(e),
                    "tenant_id": str(context.tenant_id)
                }
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create scan record: {str(e)}"
            )
        
        # Add scan task to background processing
        logger.info("Adding scan task to background processing", extra={"scan_id": scan_id})
        
        background_tasks.add_task(
            execute_aws_scan,
            scan_id,
            aws_access_key,
            aws_secret_key,
            aws_session_token,
            context.tenant_id,
            request.excluded_regions or [],
            request.scan_options
        )
        
        logger.info(
            "AWS scan initiated successfully",
            extra={
                "scan_id": scan_id,
                "tenant_id": str(context.tenant_id),
                "status": "RUNNING"
            }
        )
        
        return ScanResponse(
            scan_id=scan_id,
            message="AWS cloud scan initiated successfully",
            status="RUNNING",
            timestamp=datetime.now().isoformat(),
            tenant_id=str(context.tenant_id)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "Unexpected error in AWS scan endpoint",
            extra={
                "scan_id": scan_id,
                "error": str(e),
                "tenant_id": str(context.tenant_id)
            }
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error occurred: {str(e)}"
        )

async def execute_aws_scan(
    scan_id: str,
    aws_access_key: str,
    aws_secret_key: str,
    aws_session_token: Optional[str],
    tenant_id: str,
    excluded_regions: List[str],
    scan_options: int
):
    """
    Execute the AWS scan in the background and update the scan status.
    
    Args:
        scan_id: Unique identifier for the scan
        aws_access_key: Decrypted AWS access key
        aws_secret_key: Decrypted AWS secret key
        aws_session_token: Optional AWS session token
        tenant_id: Tenant/organization identifier
        excluded_regions: List of AWS regions to exclude from scan
        scan_options: Scan timeout and other options
    """
    logger.info(
        "Starting background AWS scan execution",
        extra={
            "scan_id": scan_id,
            "tenant_id": tenant_id,
            "excluded_regions_count": len(excluded_regions),
            "scan_timeout": scan_options
        }
    )
    
    try:
        # Execute the actual scan
        logger.info("Executing AWS scan process", extra={"scan_id": scan_id})
        
        result = process_scan_request_v2(
            aws_access_key=aws_access_key,
            aws_secret_key=aws_secret_key,
            aws_session_token=aws_session_token,
            tenant_id=tenant_id,
            excluded_regions=excluded_regions,
            scan_options=scan_options
        )
        
        logger.info(
            "AWS scan process completed successfully",
            extra={
                "scan_id": scan_id,
                "tenant_id": tenant_id
            }
        )
        
        # Update scan status to completed
        logger.info("Updating scan status to COMPLETED", extra={"scan_id": scan_id})
        
        with get_db(application_name='background-scan-update') as db:
            scan = db.query(CloudScan).filter(CloudScan.id == uuid.UUID(scan_id)).first()
            if scan:
                scan.status = "COMPLETED"
                scan.cloud_scan_metadata.update({
                    "completion_timestamp": datetime.now().isoformat(),
                    "scan_result": "SUCCESS"
                })
                db.commit()
                
                logger.info(
                    "Scan status updated to COMPLETED",
                    extra={
                        "scan_id": scan_id,
                        "tenant_id": tenant_id,
                        "final_status": "COMPLETED"
                    }
                )
            else:
                logger.warning(
                    "Scan record not found for status update",
                    extra={"scan_id": scan_id}
                )
                
    except Exception as e:
        logger.error(
            "AWS scan execution failed",
            extra={
                "scan_id": scan_id,
                "tenant_id": tenant_id,
                "error": str(e)
            }
        )
        
        # Update scan status to failed
        try:
            logger.info("Updating scan status to FAILED", extra={"scan_id": scan_id})
            
            with get_db(application_name='background-scan-error') as db:
                scan = db.query(CloudScan).filter(CloudScan.id == uuid.UUID(scan_id)).first()
                if scan:
                    scan.status = "FAILED"
                    scan.cloud_scan_metadata.update({
                        "completion_timestamp": datetime.now().isoformat(),
                        "scan_result": "FAILED",
                        "error_message": str(e)
                    })
                    db.commit()
                    
                    logger.info(
                        "Scan status updated to FAILED",
                        extra={
                            "scan_id": scan_id,
                            "tenant_id": tenant_id,
                            "final_status": "FAILED"
                        }
                    )
                else:
                    logger.warning(
                        "Scan record not found for error status update",
                        extra={"scan_id": scan_id}
                    )
                    
        except Exception as db_error:
            logger.error(
                "Failed to update scan status to FAILED",
                extra={
                    "scan_id": scan_id,
                    "db_error": str(db_error),
                    "original_error": str(e)
                }
            )
            print(f"Failed to update scan status for {scan_id}: {str(db_error)}")
        
        print(f"Scan {scan_id} failed: {str(e)}")

@api.post("/service-scan-result", response_model=ServiceScanResponse)
async def get_service_scan_result(
    request: ServiceScanRequest,
    db: Any = Depends(get_db_session)
):
    """
    Get service scan result data by scan ID, service name, and optional region.
    
    Args:
        request: ServiceScanRequest containing scan_id, service_name, and optional region
        db: Database connection
    
    Returns:
        ServiceScanResponse: Service scan result data
    
    Raises:
        HTTPException: If service scan result is not found or error occurs
    """
    try:
        logger.info(
            "Service scan result request received",
            extra={
                "scan_id": request.scan_id,
                "service_name": request.service_name,
                "region": request.region
            }
        )
        
        # Build query
        query = db.query(ServiceScanResult).filter(
            ServiceScanResult.scan_id == uuid.UUID(request.scan_id),
            ServiceScanResult.service_name == request.service_name
        )
        
        # Add region filter if provided
        if request.region:
            query = query.filter(ServiceScanResult.region == request.region)
        else:
            # If no region specified, get the record where region is null or empty
            query = query.filter(
                (ServiceScanResult.region == None) | 
                (ServiceScanResult.region == "")
            )
        
        # Execute query
        service_scan_result = query.first()
        
        if not service_scan_result:
            logger.warning(
                "Service scan result not found",
                extra={
                    "scan_id": request.scan_id,
                    "service_name": request.service_name,
                    "region": request.region
                }
            )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Service scan result not found for scan_id: {request.scan_id}, service: {request.service_name}, region: {request.region or 'global'}"
            )
        
        logger.info(
            "Service scan result retrieved successfully",
            extra={
                "scan_id": request.scan_id,
                "service_name": request.service_name,
                "region": request.region,
                "result_id": str(service_scan_result.id)
            }
        )
        
        # Convert to response format
        response = ServiceScanResponse(
            id=str(service_scan_result.id),
            scan_id=str(service_scan_result.scan_id),
            service_name=service_scan_result.service_name,
            region=service_scan_result.region,
            scan_result_metadata=service_scan_result.scan_result_metadata,
            service_scan_data=service_scan_result.service_scan_data,
            created_at=service_scan_result.created_at.isoformat() if service_scan_result.created_at else None,
            updated_at=service_scan_result.updated_at.isoformat() if service_scan_result.updated_at else None,
            tenant_id=str(service_scan_result.tenant_id) if service_scan_result.tenant_id else None,
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "Error retrieving service scan result",
            extra={
                "error": str(e),
                "scan_id": request.scan_id,
                "service_name": request.service_name,
                "region": request.region
            }
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving service scan result: {str(e)}"
        )

@api.post("/scans", response_model=List[ScanListResponse])
async def get_scans(
    request: ScanListRequest,
    context: TenantContext = Depends(get_current_context),
    db: Any = Depends(get_db_session)
):
    """
    Get a list of scans for the authenticated tenant.
    
    Args:
        request: ScanListRequest containing optional filters
        context: Authenticated user and tenant context
        db: Database connection
    
    Returns:
        List[ScanListResponse]: List of scans scoped to the authenticated tenant
    
    Raises:
        HTTPException: If there's an error retrieving scans
    """
    try:
        logger.info(
            "Scans list request received",
            extra={
                "tenant_id": str(context.tenant_id),
                "user_id": str(context.user_id),
                "status": request.status,
                "cloud_provider": request.cloud_provider,
                "limit": request.limit,
                "offset": request.offset
            }
        )
        
        # Build query - automatically scoped to the authenticated tenant
        query = db.query(CloudScan).filter(CloudScan.created_by == context.tenant_id)
        
        # Apply optional filters
        if request.status:
            query = query.filter(CloudScan.status == request.status.upper())
        
        if request.cloud_provider:
            query = query.filter(CloudScan.cloud_provider == request.cloud_provider.upper())
        
        # Apply pagination and ordering (most recent first)
        query = query.order_by(CloudScan.created_at.desc())
        query = query.offset(request.offset).limit(request.limit)
        
        # Execute query
        scans = query.all()
        
        logger.info(
            "Scans retrieved successfully",
            extra={
                "scans_count": len(scans),
                "tenant_id": str(context.tenant_id),
                "status": request.status,
                "cloud_provider": request.cloud_provider
            }
        )
        
        # Convert to response format
        response_scans = []
        for scan in scans:
            response_scans.append(ScanListResponse(
                scan_id=str(scan.id),
                name=scan.name,
                status=scan.status,
                cloud_provider=scan.cloud_provider,
                created_by=str(scan.created_by),
                metadata=scan.cloud_scan_metadata,
                created_at=scan.created_at.isoformat() if scan.created_at else None,
                updated_at=scan.updated_at.isoformat() if scan.updated_at else None
            ))
        
        return response_scans
        
    except Exception as e:
        logger.error(
            "Error retrieving scans",
            extra={
                "error": str(e),
                "tenant_id": request.tenant_id,
                "status": request.status,
                "cloud_provider": request.cloud_provider
            }
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving scans: {str(e)}"
        )

@api.get("/scan-status/{scan_id}")
async def get_scan_status(scan_id: str, db: Any = Depends(get_db_session)):
    """
    Get the status of a specific scan.
    
    Args:
        scan_id: The unique identifier of the scan
        db: Database connection
    
    Returns:
        Dict containing scan status and metadata
    
    Raises:
        HTTPException: If scan is not found
    """
    logger.info("Scan status request received", extra={"scan_id": scan_id})
    
    try:
        scan = db.query(CloudScan).filter(CloudScan.id == uuid.UUID(scan_id)).first()
        
        if not scan:
            logger.warning("Scan not found", extra={"scan_id": scan_id})
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Scan not found"
            )
        
        logger.info(
            "Scan status retrieved successfully",
            extra={
                "scan_id": scan_id,
                "status": scan.status,
                "tenant_id": scan.created_by,
                "cloud_provider": scan.cloud_provider
            }
        )
        
        return {
            "scan_id": str(scan.id),
            "status": scan.status,
            "name": scan.name,
            "cloud_provider": scan.cloud_provider,
            "created_by": scan.created_by,
            "metadata": scan.cloud_scan_metadata,
            "created_at": scan.created_at.isoformat() if scan.created_at else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "Error retrieving scan status",
            extra={
                "scan_id": scan_id,
                "error": str(e)
            }
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving scan status: {str(e)}"
        )

    
@api.get("/scan/{scan_id}") 
async def get_scan(scan_id: str, db: Any = Depends(get_db_session)):
    """
    Get a specific scan by ID with associated service scan results.
    
    Args:
        scan_id: The unique identifier of the scan
        db: Database connection
    
    Returns:
        Dict containing scan details and service scan results
    
    Raises:
        HTTPException: If scan is not found
    """
    logger.info("Scan request received", extra={"scan_id": scan_id})

    try:
        # Get the main scan record
        scan = db.query(CloudScan).filter(CloudScan.id == uuid.UUID(scan_id)).first()
        
        if not scan:
            logger.warning("Scan not found", extra={"scan_id": scan_id})
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Scan not found"
            )
        
        # Get associated service scan results
        service_scan_results = db.query(ServiceScanResult).filter(
            ServiceScanResult.scan_id == uuid.UUID(scan_id)
        ).all()
        
        logger.info(
            "Scan retrieved successfully",
            extra={
                "scan_id": scan_id,
                "status": scan.status,
                "tenant_id": str(scan.created_by),
                "cloud_provider": scan.cloud_provider,
                "service_results_count": len(service_scan_results)
            }
        )
        
        # Convert service scan results to response format
        service_results = []
        for service_result in service_scan_results:
            service_results.append({
                "id": str(service_result.id),
                "service_name": service_result.service_name,
                "region": service_result.region,
                "scan_result_metadata": service_result.scan_result_metadata,
                "service_scan_data": service_result.service_scan_data,
                "created_at": service_result.created_at.isoformat() if service_result.created_at else None,
                "updated_at": service_result.updated_at.isoformat() if service_result.updated_at else None,
                "tenant_id": str(service_result.tenant_id) if service_result.tenant_id else None,
            })
        
        return {
            "scan_id": str(scan.id),
            "status": scan.status,
            "name": scan.name,
            "cloud_provider": scan.cloud_provider,
            "created_by": str(scan.created_by),
            "metadata": scan.cloud_scan_metadata,
            "created_at": scan.created_at.isoformat() if scan.created_at else None,
            "updated_at": scan.updated_at.isoformat() if scan.updated_at else None,
            "service_scan_results": service_results
        }
    except HTTPException:   
        raise
    except Exception as e:
        logger.error(
            "Error retrieving scan",
            extra={
                "error": str(e),
                "scan_id": scan_id
            }
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving scan: {str(e)}"
        )