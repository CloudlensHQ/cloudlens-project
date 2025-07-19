from sqlalchemy import Column, ForeignKey, Text, JSON, TIMESTAMP, Boolean, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import uuid

Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    onboarding_completed = Column(Boolean, default=False, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    last_login = Column(TIMESTAMP(timezone=True), nullable=True)
    
    # Relationship to tenant for organization/team functionality
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenant.id", ondelete="CASCADE"), nullable=True)
    tenant = relationship("Tenant", back_populates="users")


class Tenant(Base):
    __tablename__ = "tenant"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    tenant_metadata = Column(JSON, nullable=True)
    name = Column(JSON, nullable=True)
    email = Column(JSON, nullable=True)
    external_id = Column(Text, nullable=True)
    
    # Relationship to users and scans
    users = relationship("User", back_populates="tenant")
    cloud_scans = relationship("CloudScan", back_populates="tenant")


class CloudScan(Base):
    __tablename__ = "cloud_scan"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    name = Column(Text, nullable=True)
    cloud_scan_metadata = Column(JSON, nullable=True)
    
    # Fixed: Remove default value and make it nullable=False to ensure it's always set
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenant.id", onupdate="CASCADE", ondelete="CASCADE"), nullable=False)
    status = Column(Text, nullable=True)  # Adjust type if scan_status is an ENUM
    cloud_provider = Column(Text, nullable=True)  # Adjust type if cloud_provider is an ENUM
    
    # Proper relationship setup
    tenant = relationship("Tenant", back_populates="cloud_scans")
    service_scan_results = relationship("ServiceScanResult", back_populates="cloud_scan", cascade="all, delete-orphan")


class ServiceScanResult(Base):
    __tablename__ = "service_scan_result"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    scan_id = Column(UUID(as_uuid=True), ForeignKey("cloud_scan.id", ondelete="CASCADE"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False)
    service_name = Column(Text, nullable=True)
    scan_result_metadata = Column(JSON, nullable=True)
    service_scan_data = Column(JSON, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    region = Column(Text, nullable=True)
    
    cloud_scan = relationship("CloudScan", back_populates="service_scan_results")
    tenant = relationship("Tenant")


class Region(Base):
    __tablename__ = "regions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    name = Column(Text, nullable=True)
    cloud_provider = Column(Text, nullable=True)  # AWS, GCP, AZURE, etc.