import base64
import os
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from typing import Tuple

from .config import settings


class EncryptionService:
    def __init__(self):
        self.encryption_key = settings.encryption_key
        self._fernet = None
    
    def _get_fernet(self) -> Fernet:
        """Get or create Fernet cipher instance"""
        if self._fernet is None:
            # If encryption_key is a password, derive a key from it
            if len(self.encryption_key) != 44:  # Not a base64-encoded 32-byte key
                # Derive key from password
                salt = b'stable_salt_for_aws_creds'  # In production, use a random salt per organization
                kdf = PBKDF2HMAC(
                    algorithm=hashes.SHA256(),
                    length=32,
                    salt=salt,
                    iterations=100000,
                )
                key = base64.urlsafe_b64encode(kdf.derive(self.encryption_key.encode()))
            else:
                key = self.encryption_key.encode()
            
            self._fernet = Fernet(key)
        return self._fernet
    
    def encrypt(self, plaintext: str) -> str:
        """Encrypt plaintext string and return base64 encoded encrypted data"""
        if not plaintext:
            return ""
        
        fernet = self._get_fernet()
        encrypted_data = fernet.encrypt(plaintext.encode())
        return base64.urlsafe_b64encode(encrypted_data).decode()
    
    def decrypt(self, encrypted_data: str) -> str:
        """Decrypt base64 encoded encrypted data and return plaintext string"""
        if not encrypted_data:
            return ""
        
        fernet = self._get_fernet()
        try:
            decoded_data = base64.urlsafe_b64decode(encrypted_data.encode())
            decrypted_data = fernet.decrypt(decoded_data)
            return decrypted_data.decode()
        except Exception as e:
            raise ValueError(f"Failed to decrypt data: {str(e)}")
    
    def encrypt_aws_credentials(self, access_key: str, secret_key: str, session_token: str = None) -> Tuple[str, str, str]:
        """Encrypt AWS credentials and return encrypted versions"""
        encrypted_access_key = self.encrypt(access_key)
        encrypted_secret_key = self.encrypt(secret_key)
        encrypted_session_token = self.encrypt(session_token) if session_token else None
        
        return encrypted_access_key, encrypted_secret_key, encrypted_session_token
    
    def decrypt_aws_credentials(self, encrypted_access_key: str, encrypted_secret_key: str, encrypted_session_token: str = None) -> Tuple[str, str, str]:
        """Decrypt AWS credentials and return plaintext versions"""
        access_key = self.decrypt(encrypted_access_key)
        secret_key = self.decrypt(encrypted_secret_key)
        session_token = self.decrypt(encrypted_session_token) if encrypted_session_token else None
        
        return access_key, secret_key, session_token


# Global encryption service instance
encryption_service = EncryptionService()


def generate_encryption_key() -> str:
    """Generate a new encryption key for use in settings"""
    key = Fernet.generate_key()
    return key.decode()


# Utility functions for easy access
def encrypt_string(plaintext: str) -> str:
    """Convenience function to encrypt a string"""
    return encryption_service.encrypt(plaintext)


def decrypt_string(encrypted_data: str) -> str:
    """Convenience function to decrypt a string"""
    return encryption_service.decrypt(encrypted_data) 