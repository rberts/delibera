"""Pydantic schemas for condominium CRUD operations."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator


class CondominiumBase(BaseModel):
    """Base schema with common fields."""

    name: str
    address: str

    @field_validator("name")
    @classmethod
    def name_must_not_be_empty(cls, value: str) -> str:
        """Validate name is not empty."""
        if not value or not value.strip():
            raise ValueError("Name cannot be empty")
        return value.strip()


class CondominiumCreate(CondominiumBase):
    """Schema for creating a condominium."""


class CondominiumUpdate(BaseModel):
    """Schema for updating a condominium (all fields optional)."""

    name: Optional[str] = None
    address: Optional[str] = None

    @field_validator("name")
    @classmethod
    def name_must_not_be_empty(cls, value: Optional[str]) -> Optional[str]:
        """Validate name if provided."""
        if value is not None and not value.strip():
            raise ValueError("Name cannot be empty")
        return value.strip() if value else None


class CondominiumResponse(CondominiumBase):
    """Schema for condominium response."""

    id: int
    tenant_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CondominiumListResponse(BaseModel):
    """Schema for paginated list of condominiums."""

    items: list[CondominiumResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
