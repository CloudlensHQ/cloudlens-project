from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from typing import List, Optional
import logging
from sqlalchemy.orm import Session

from dbschema.db_connector import get_db_session
from dbschema.model import Region

logger = logging.getLogger(__name__)

api = APIRouter(prefix="/api/regions", tags=["Cloud Provider Regions"])

class RegionResponse(BaseModel):
    """Region response model"""
    id: str
    name: Optional[str]
    cloud_provider: Optional[str]
    created_at: str
    updated_at: Optional[str]

    class Config:
        from_attributes = True

@api.get("/", response_model=List[RegionResponse])
async def get_regions(
    cloud_provider: Optional[str] = Query(None, description="Filter by cloud provider (AWS, GCP, AZURE, etc.)"),
    db: Session = Depends(get_db_session)
):
    """
    Get all regions, optionally filtered by cloud provider.
    
    Args:
        cloud_provider: Optional cloud provider filter (AWS, GCP, AZURE, etc.)
        db: Database connection
    
    Returns:
        List[RegionResponse]: List of regions matching the criteria
    
    Raises:
        HTTPException: If there's an error retrieving regions
    """
    try:
        logger.info(
            "Regions request received",
            extra={
                "cloud_provider_filter": cloud_provider
            }
        )
        
        # Build query
        query = db.query(Region)
        
        # Apply cloud provider filter if provided
        if cloud_provider:
            cloud_provider_upper = cloud_provider.upper()
            query = query.filter(Region.cloud_provider == cloud_provider_upper)
        
        # Execute query
        regions = query.all()
        
        logger.info(
            "Regions retrieved successfully",
            extra={
                "regions_count": len(regions),
                "cloud_provider_filter": cloud_provider
            }
        )
        
        # Convert to response format
        response_regions = []
        for region in regions:
            response_regions.append(RegionResponse(
                id=str(region.id),
                name=region.name,
                cloud_provider=region.cloud_provider,
                created_at=region.created_at.isoformat() if region.created_at else "",
                updated_at=region.updated_at.isoformat() if region.updated_at else None
            ))
        
        return response_regions
        
    except Exception as e:
        logger.error(
            "Error retrieving regions",
            extra={
                "error": str(e),
                "cloud_provider_filter": cloud_provider
            }
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving regions: {str(e)}"
        )

@api.get("/{cloud_provider}", response_model=List[RegionResponse])
async def get_regions_by_provider(
    cloud_provider: str,
    db: Session = Depends(get_db_session)
):
    """
    Get all regions for a specific cloud provider.
    
    Args:
        cloud_provider: Cloud provider (AWS, GCP, AZURE, etc.)
        db: Database connection
    
    Returns:
        List[RegionResponse]: List of regions for the specified cloud provider
    
    Raises:
        HTTPException: If there's an error retrieving regions
    """
    try:
        cloud_provider_upper = cloud_provider.upper()
        
        logger.info(
            "Regions by provider request received",
            extra={
                "cloud_provider": cloud_provider_upper
            }
        )
        
        # Query regions for the specific cloud provider
        regions = db.query(Region).filter(Region.cloud_provider == cloud_provider_upper).all()
        
        logger.info(
            "Regions by provider retrieved successfully",
            extra={
                "regions_count": len(regions),
                "cloud_provider": cloud_provider_upper
            }
        )
        
        # Convert to response format
        response_regions = []
        for region in regions:
            response_regions.append(RegionResponse(
                id=str(region.id),
                name=region.name,
                cloud_provider=region.cloud_provider,
                created_at=region.created_at.isoformat() if region.created_at else "",
                updated_at=region.updated_at.isoformat() if region.updated_at else None
            ))
        
        return response_regions
        
    except Exception as e:
        logger.error(
            "Error retrieving regions by provider",
            extra={
                "error": str(e),
                "cloud_provider": cloud_provider_upper
            }
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving regions for {cloud_provider}: {str(e)}"
        )
