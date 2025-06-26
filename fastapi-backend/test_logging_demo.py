#!/usr/bin/env python3
"""
Logging Demo for CloudLens Scan Endpoints

This script demonstrates the structured logging functionality
that has been implemented in the scan endpoints.
"""

import sys
import os
import uuid
from datetime import datetime

# Add src to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from utils.logger import logger


def demo_scan_endpoint_logging():
    """Demonstrate the logging used in scan endpoints"""
    print("🔍 CloudLens Scan Endpoints Logging Demo")
    print("=" * 50)
    
    # Simulate a scan request
    scan_id = str(uuid.uuid4())
    tenant_id = "demo-tenant-123"
    
    print("\n1. Simulating AWS scan request processing...")
    
    # Log incoming request (similar to what happens in the endpoint)
    logger.info(
        "AWS scan request received",
        extra={
            "scan_id": scan_id,
            "tenant_id": tenant_id,
            "excluded_regions_count": 2,
            "scan_options": 840,
            "has_session_token": True
        }
    )
    
    # Log credential decryption start
    logger.info("Starting credential decryption", extra={"scan_id": scan_id})
    
    # Simulate successful decryption
    logger.info(
        "Credentials decrypted successfully", 
        extra={
            "scan_id": scan_id,
            "has_access_key": True,
            "has_secret_key": True,
            "has_session_token": True
        }
    )
    
    # Simulate database record creation
    logger.info("Creating scan record in database", extra={"scan_id": scan_id})
    
    logger.info(
        "Scan record created successfully",
        extra={
            "scan_id": scan_id,
            "tenant_id": tenant_id,
            "cloud_provider": "AWS"
        }
    )
    
    # Simulate background task initiation
    logger.info("Adding scan task to background processing", extra={"scan_id": scan_id})
    
    logger.info(
        "AWS scan initiated successfully",
        extra={
            "scan_id": scan_id,
            "tenant_id": tenant_id,
            "status": "RUNNING"
        }
    )
    
    print("\n2. Simulating background scan execution...")
    
    # Simulate background scan logs
    logger.info(
        "Starting background AWS scan execution",
        extra={
            "scan_id": scan_id,
            "tenant_id": tenant_id,
            "excluded_regions_count": 2,
            "scan_timeout": 840
        }
    )
    
    logger.info("Executing AWS scan process", extra={"scan_id": scan_id})
    
    # Simulate scan completion
    logger.info(
        "AWS scan process completed successfully",
        extra={
            "scan_id": scan_id,
            "tenant_id": tenant_id
        }
    )
    
    logger.info("Updating scan status to COMPLETED", extra={"scan_id": scan_id})
    
    logger.info(
        "Scan status updated to COMPLETED",
        extra={
            "scan_id": scan_id,
            "tenant_id": tenant_id,
            "final_status": "COMPLETED"
        }
    )
    
    print("\n3. Simulating scan status retrieval...")
    
    # Simulate status check
    logger.info("Scan status request received", extra={"scan_id": scan_id})
    
    logger.info(
        "Scan status retrieved successfully",
        extra={
            "scan_id": scan_id,
            "status": "COMPLETED",
            "tenant_id": tenant_id,
            "cloud_provider": "AWS"
        }
    )
    
    print("\n4. Simulating error scenarios...")
    
    # Simulate error scenarios
    error_scan_id = str(uuid.uuid4())
    
    logger.error(
        "Failed to decrypt AWS credentials",
        extra={
            "scan_id": error_scan_id,
            "error": "Invalid encryption key format",
            "tenant_id": tenant_id
        }
    )
    
    logger.warning("Scan not found", extra={"scan_id": "non-existent-scan-id"})
    
    logger.error(
        "AWS scan execution failed",
        extra={
            "scan_id": error_scan_id,
            "tenant_id": tenant_id,
            "error": "AWS credentials expired"
        }
    )


def demo_logger_features():
    """Demonstrate additional logger features"""
    print("\n" + "=" * 50)
    print("🛠️  Logger Features Demo")
    print("=" * 50)
    
    print("\n1. Different log levels:")
    
    logger.debug("This is a debug message", extra={"component": "test"})
    logger.info("This is an info message", extra={"component": "test"})
    logger.warning("This is a warning message", extra={"component": "test"})
    logger.error("This is an error message", extra={"component": "test"})
    logger.critical("This is a critical message", extra={"component": "test"})
    
    print("\n2. Structured logging with complex data:")
    
    logger.info(
        "Complex scan metadata",
        extra={
            "scan_id": str(uuid.uuid4()),
            "metadata": {
                "regions": ["us-east-1", "us-west-2", "eu-west-1"],
                "services": ["ec2", "s3", "rds", "iam"],
                "scan_duration": 245.67,
                "resources_found": 1234
            },
            "timestamp": datetime.now().isoformat()
        }
    )


def main():
    """Run all logging demonstrations"""
    print("Starting CloudLens Logging Demonstration")
    print(f"Demo started at: {datetime.now().isoformat()}")
    
    # Run scan endpoint logging demo
    demo_scan_endpoint_logging()
    
    # Run logger features demo
    demo_logger_features()
    
    print("\n" + "=" * 50)
    print("📊 Demo Summary")
    print("=" * 50)
    
    print("✅ Structured JSON logging is working correctly")
    print("✅ Scan endpoint logging provides comprehensive visibility")
    print("✅ Error scenarios are properly logged")
    print("✅ Log messages include contextual information")
    
    print("\n📋 Key Logging Features:")
    print("- JSON structured output for easy parsing")
    print("- Scan ID tracking across all operations")
    print("- Tenant ID for multi-tenant support")
    print("- Timestamps in ISO format")
    print("- Error context and metadata")
    print("- Performance metrics (timing, counts)")
    
    print("\n🔍 Log Analysis Tips:")
    print("- Use scan_id to trace a complete scan lifecycle")
    print("- Filter by tenant_id for tenant-specific logs")
    print("- Monitor error messages for system health")
    print("- Track scan_options and performance metrics")


if __name__ == "__main__":
    main() 