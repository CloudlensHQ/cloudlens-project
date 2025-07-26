import base64
import os
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from typing import Tuple
import secrets

from .config import settings


class SimpleEncryptionService:
    """
    Simple AES encryption service without salt or key derivation.
    Uses the encryption key directly for AES-256-CBC encryption.
    """
    
    def __init__(self):
        self.encryption_key = settings.encryption_key
        # Ensure we have a 32-byte key for AES-256
        self._validate_key()
    
    def _validate_key(self):
        """Validate and prepare the encryption key"""
        if len(self.encryption_key) < 32:
            # Pad key to 32 bytes if shorter
            self.encryption_key = self.encryption_key.ljust(32, '0')
        elif len(self.encryption_key) > 32:
            # Truncate key to 32 bytes if longer
            self.encryption_key = self.encryption_key[:32]
        
        # Convert to bytes
        self.key_bytes = self.encryption_key.encode('utf-8')
    
    def encrypt(self, plaintext: str) -> str:
        """
        Encrypt plaintext string and return base64 encoded encrypted data.
        Format: base64(iv + encrypted_data)
        """
        if not plaintext:
            return ""
        
        try:
            # Generate random 16-byte IV
            iv = secrets.token_bytes(16)
            
            # Create cipher
            cipher = Cipher(
                algorithms.AES(self.key_bytes),
                modes.CBC(iv),
                backend=default_backend()
            )
            encryptor = cipher.encryptor()
            
            # Pad plaintext to be a multiple of 16 bytes (PKCS7 padding)
            plaintext_bytes = plaintext.encode('utf-8')
            padding_length = 16 - (len(plaintext_bytes) % 16)
            padded_plaintext = plaintext_bytes + bytes([padding_length] * padding_length)
            
            # Encrypt
            encrypted_data = encryptor.update(padded_plaintext) + encryptor.finalize()
            
            # Combine IV + encrypted data and encode as base64
            combined = iv + encrypted_data
            return base64.b64encode(combined).decode('utf-8')
            
        except Exception as e:
            raise ValueError(f"Failed to encrypt data: {str(e)}")
    
    def decrypt(self, encrypted_data: str) -> str:
        """
        Decrypt base64 encoded encrypted data and return plaintext string.
        Expected format: base64(iv + encrypted_data)
        """
        if not encrypted_data:
            return ""
        
        try:
            # Decode base64
            combined_data = base64.b64decode(encrypted_data.encode('utf-8'))
            
            # Extract IV (first 16 bytes) and encrypted data
            iv = combined_data[:16]
            encrypted_bytes = combined_data[16:]
            
            # Create cipher
            cipher = Cipher(
                algorithms.AES(self.key_bytes),
                modes.CBC(iv),
                backend=default_backend()
            )
            decryptor = cipher.decryptor()
            
            # Decrypt
            padded_plaintext = decryptor.update(encrypted_bytes) + decryptor.finalize()
            
            # Remove PKCS7 padding
            padding_length = padded_plaintext[-1]
            plaintext_bytes = padded_plaintext[:-padding_length]
            
            return plaintext_bytes.decode('utf-8')
            
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


# Create a singleton instance
_encryption_service = None

def get_encryption_service() -> SimpleEncryptionService:
    """Get the singleton encryption service instance"""
    global _encryption_service
    if _encryption_service is None:
        _encryption_service = SimpleEncryptionService()
    return _encryption_service

# For backwards compatibility, keep the old class name as alias
EncryptionService = SimpleEncryptionService 