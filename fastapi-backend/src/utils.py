#!/usr/bin/env python3
"""
Utility functions for CloudLens Backend
"""

from cryptography.fernet import Fernet
import base64
import json
from typing import Dict, Any, Optional
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import secrets
import hashlib
import bcrypt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
import jwt
from .config import settings

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=24)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return encoded_jwt

def create_refresh_token(data: dict) -> str:
    """Create a JWT refresh token with longer expiration"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=30)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.JWTError:
        return None

def generate_encryption_key():
    """Generate a new encryption key for AWS credentials"""
    key = Fernet.generate_key()
    print(f"Generated encryption key: {key.decode()}")
    return key.decode()

def generate_jwt_secret():
    """Generate a random JWT secret key"""
    secret = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode()
    print(f"Generated JWT secret: {secret}")
    return secret

class ClientEncryptionUtils:
    """
    Utility class for client-side encryption operations.
    This helps implement end-to-end encryption where credentials are encrypted
    on the client side before being sent to the backend.
    """
    
    @staticmethod
    def generate_client_key_from_password(password: str, salt: Optional[bytes] = None) -> tuple[bytes, bytes]:
        """
        Generate an encryption key from a password using PBKDF2.
        
        Args:
            password: The password to derive the key from
            salt: Optional salt bytes. If None, a random salt is generated
            
        Returns:
            Tuple of (key, salt) where key is the derived encryption key
        """
        if salt is None:
            salt = secrets.token_bytes(16)  # 128-bit salt
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,  # 256-bit key
            salt=salt,
            iterations=100000,  # OWASP recommended minimum
        )
        key = kdf.derive(password.encode())
        return key, salt
    
    @staticmethod
    def encrypt_credentials_for_client(
        access_key: str, 
        secret_key: str, 
        session_token: Optional[str],
        client_password: str
    ) -> Dict[str, str]:
        """
        Encrypt AWS credentials using a client-side password.
        This function would typically be used on the frontend/client side.
        
        Args:
            access_key: AWS access key
            secret_key: AWS secret key  
            session_token: Optional AWS session token
            client_password: Password for encryption
            
        Returns:
            Dictionary containing encrypted credentials and salt
        """
        # Generate key from password
        key, salt = ClientEncryptionUtils.generate_client_key_from_password(client_password)
        
        # Create Fernet cipher
        fernet = Fernet(base64.urlsafe_b64encode(key))
        
        # Encrypt credentials
        encrypted_access_key = base64.urlsafe_b64encode(
            fernet.encrypt(access_key.encode())
        ).decode()
        
        encrypted_secret_key = base64.urlsafe_b64encode(
            fernet.encrypt(secret_key.encode())
        ).decode()
        
        encrypted_session_token = None
        if session_token:
            encrypted_session_token = base64.urlsafe_b64encode(
                fernet.encrypt(session_token.encode())
            ).decode()
        
        return {
            "encrypted_aws_access_key": encrypted_access_key,
            "encrypted_aws_secret_key": encrypted_secret_key,
            "encrypted_aws_session_token": encrypted_session_token,
            "salt": base64.urlsafe_b64encode(salt).decode(),
            "encryption_method": "PBKDF2-SHA256-Fernet"
        }
    
    @staticmethod
    def decrypt_credentials_from_client(
        encrypted_data: Dict[str, str],
        client_password: str
    ) -> Dict[str, Optional[str]]:
        """
        Decrypt credentials that were encrypted on the client side.
        
        Args:
            encrypted_data: Dictionary containing encrypted credentials and salt
            client_password: Password used for encryption
            
        Returns:
            Dictionary with decrypted credentials
        """
        # Recreate the key using the same salt
        salt = base64.urlsafe_b64decode(encrypted_data["salt"])
        key, _ = ClientEncryptionUtils.generate_client_key_from_password(client_password, salt)
        
        # Create Fernet cipher
        fernet = Fernet(base64.urlsafe_b64encode(key))
        
        # Decrypt credentials
        access_key = fernet.decrypt(
            base64.urlsafe_b64decode(encrypted_data["encrypted_aws_access_key"])
        ).decode()
        
        secret_key = fernet.decrypt(
            base64.urlsafe_b64decode(encrypted_data["encrypted_aws_secret_key"])
        ).decode()
        
        session_token = None
        if encrypted_data.get("encrypted_aws_session_token"):
            session_token = fernet.decrypt(
                base64.urlsafe_b64decode(encrypted_data["encrypted_aws_session_token"])
            ).decode()
        
        return {
            "aws_access_key": access_key,
            "aws_secret_key": secret_key,
            "aws_session_token": session_token
        }


def create_scan_request_payload(
    encrypted_credentials: Dict[str, str],
    tenant_id: str,
    excluded_regions: Optional[list] = None,
    scan_options: int = 840
) -> Dict[str, Any]:
    """
    Create a properly formatted scan request payload.
    
    Args:
        encrypted_credentials: Dictionary containing encrypted AWS credentials
        tenant_id: Tenant/organization identifier
        excluded_regions: Optional list of regions to exclude
        scan_options: Scan timeout and other options
        
    Returns:
        Dictionary formatted for the scan API endpoint
    """
    return {
        "encrypted_aws_access_key": encrypted_credentials["encrypted_aws_access_key"],
        "encrypted_aws_secret_key": encrypted_credentials["encrypted_aws_secret_key"],
        "encrypted_aws_session_token": encrypted_credentials.get("encrypted_aws_session_token"),
        "tenant_id": tenant_id,
        "excluded_regions": excluded_regions or [],
        "scan_options": scan_options
    }


def generate_secure_tenant_id() -> str:
    """
    Generate a secure tenant ID using cryptographically secure random bytes.
    
    Returns:
        Secure tenant ID string
    """
    # Generate 16 random bytes and encode as hex
    random_bytes = secrets.token_bytes(16)
    return hashlib.sha256(random_bytes).hexdigest()[:24]  # 24 character hex string


# Example usage functions for testing/demonstration
def example_client_side_encryption():
    """
    Example of how client-side encryption would work.
    This demonstrates the flow that would happen on the frontend.
    """
    # Simulated user input
    aws_access_key = "AKIAIOSFODNN7EXAMPLE"
    aws_secret_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
    aws_session_token = "AQoEXAMPLEH4aoAH0gNCAPyJxz4BlCFFxWNE1OPTgk5TthT+FvwqnKwRcOIfrRh3c/LTo6UDdyJwOOvEVPvLXCrrrUtdnniCEXAMPLE/IvU1dYUg2RVAJBanLiHb4IgRmpRV3zrkuWJOgQs8IZZaIv2BXIa2R4OlgkBN9bkUDNCJiBeb/AXlzBBko7b15fjrBs2+cTQtpZ3CYWFXG8C5zqx37wnOE49mRl/+OtkIKGO7fAE"
    client_password = "user_master_password_123"
    
    # Step 1: Encrypt credentials on client side
    encrypted_creds = ClientEncryptionUtils.encrypt_credentials_for_client(
        aws_access_key, aws_secret_key, aws_session_token, client_password
    )
    
    # Step 2: Create scan request payload
    tenant_id = generate_secure_tenant_id()
    scan_payload = create_scan_request_payload(
        encrypted_creds,
        tenant_id,
        excluded_regions=["us-west-1", "eu-west-3"],
        scan_options=600
    )
    
    print("Client-side encrypted payload:")
    print(json.dumps(scan_payload, indent=2))
    
    # Step 3: Demonstrate decryption (this would happen on backend)
    decrypted_creds = ClientEncryptionUtils.decrypt_credentials_from_client(
        encrypted_creds, client_password
    )
    
    print("\nDecrypted credentials:")
    print(json.dumps(decrypted_creds, indent=2))
    
    return encrypted_creds, scan_payload


if __name__ == "__main__":
    # Run example
    example_client_side_encryption()

