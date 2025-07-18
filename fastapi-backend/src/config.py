import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_hostname: str
    database_port: str
    database_password: str
    database_username: str
    database_name: str

    supabase_url: str
    supabase_key: str

    # WorkOS settings
    workos_client_secret: str
    workos_client_id: str
    workos_webhook_secret: str
    
    # Encryption key for AWS credentials (should be 32 bytes base64 encoded)
    encryption_key: str
    
    # JWT settings
    jwt_secret: str = "your-super-secret-jwt-key-change-this-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30
    jwt_refresh_token_expire_days: int = 30

    model_config = SettingsConfigDict(
        env_file=(".env")
    )


settings = Settings()