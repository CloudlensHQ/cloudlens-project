from sqlalchemy import Column, ForeignKey, Text, JSON, TIMESTAMP, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import uuid

Base = declarative_base()



class Tenant(Base):
    __tablename__ = "tenant"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    tenant_metadata = Column(JSON, nullable=True)
    name = Column(JSON, nullable=True)
    email = Column(JSON, nullable=True)
    external_id = Column(Text, nullable=True)
    


class CloudScan(Base):
    __tablename__ = "cloud_scan"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    name = Column(Text, nullable=True)
    cloud_scan_metadata = Column(JSON, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("tenant.id", onupdate="CASCADE", ondelete="CASCADE"), default=uuid.uuid4, nullable=True)
    status = Column(Text, nullable=True)  # Adjust type if scan_status is an ENUM
    cloud_provider = Column(Text, nullable=True)  # Adjust type if cloud_provider is an ENUM
    
    tenant = relationship("Tenant", backref="cloud_scans")

class ServiceScanResult(Base):
    __tablename__ = "service_scan_result"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    scan_id = Column(UUID(as_uuid=True), ForeignKey("cloud_scan.id", ondelete="CASCADE"), default=uuid.uuid4, nullable=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenant.id", ondelete="CASCADE"), default=uuid.uuid4, nullable=True)
    service_name = Column(Text, nullable=True)
    scan_result_metadata = Column(JSON, nullable=True)
    service_scan_data = Column(JSON, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    region = Column(Text, nullable=True)
    
    cloud_scan = relationship("CloudScan", backref="service_scan_results")
    tenant = relationship("Tenant", backref="service_scan_results")

class Region(Base):
    __tablename__ = "regions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    name = Column(Text, nullable=True)
    cloud_provider = Column(Text, nullable=True)  # AWS, GCP, AZURE, etc.