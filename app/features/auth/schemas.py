"""Pydantic schemas for authentication endpoints."""
from pydantic import BaseModel, EmailStr, ConfigDict


class LoginRequest(BaseModel):
    """Login request payload."""
    email: EmailStr
    password: str


class TokenData(BaseModel):
    """Data stored in JWT token."""
    sub: int
    tenant_id: int
    role: str
    exp: int


class TokenResponse(BaseModel):
    """Token response (for API docs)."""
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """User information response."""
    id: int
    email: str
    name: str
    role: str
    tenant_id: int

    model_config = ConfigDict(from_attributes=True)
