"""
Application settings using Pydantic BaseSettings.
Loads from environment variables with validation.
"""
from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration settings."""

    # Application
    APP_NAME: str = "Delibera API"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173"]
    ALLOWED_HOSTS: List[str] = ["*"]

    # Cookie settings
    COOKIE_DOMAIN: str = "localhost"
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"

    # File upload
    MAX_UPLOAD_SIZE_MB: int = 5

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
