"""Pydantic schemas for user CRUD operations."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator

from app.core.enums import UserRole, UserStatus


class UserBase(BaseModel):
    """Base schema with common fields."""

    name: str
    email: EmailStr
    role: UserRole = UserRole.assembly_operator

    @field_validator("name")
    @classmethod
    def name_must_not_be_empty(cls, value: str) -> str:
        """Validate name is not empty."""
        if not value or not value.strip():
            raise ValueError("Name cannot be empty")
        return value.strip()


class UserCreate(UserBase):
    """Schema for creating a user."""

    password: str


class UserUpdate(BaseModel):
    """Schema for updating a user (all fields optional)."""

    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    password: Optional[str] = None
    status: Optional[UserStatus] = None

    @field_validator("name")
    @classmethod
    def name_must_not_be_empty(cls, value: Optional[str]) -> Optional[str]:
        """Validate name if provided."""
        if value is not None and not value.strip():
            raise ValueError("Name cannot be empty")
        return value.strip() if value else None


class UserResponse(BaseModel):
    """Schema for user response."""

    id: int
    tenant_id: int
    name: str
    email: EmailStr
    role: UserRole
    status: UserStatus
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UserListResponse(BaseModel):
    """Schema for paginated list of users."""

    items: list[UserResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
