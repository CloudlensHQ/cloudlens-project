from fastapi import APIRouter

from .scan_endpoints import api as scan_router
from .cloud_provider_regions import api as regions_router

router = APIRouter(tags=["All API Endpoints"])

router.include_router(scan_router)
router.include_router(regions_router)


