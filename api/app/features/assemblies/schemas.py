"""Pydantic schemas for assembly CRUD operations."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator

from app.core.enums import AssemblyStatus, AssemblyType


class AssemblyBase(BaseModel):
    """Base schema with common fields."""

    condominium_id: int
    operator_id: Optional[int] = None
    title: str
    assembly_date: datetime
    location: str
    assembly_type: AssemblyType

    @field_validator("title")
    @classmethod
    def title_must_not_be_empty(cls, value: str) -> str:
        """Validate title is not empty."""
        if not value or not value.strip():
            raise ValueError("Title cannot be empty")
        return value.strip()


class AssemblyCreate(AssemblyBase):
    """Schema for creating an assembly."""


class AssemblyUpdate(BaseModel):
    """Schema for updating an assembly (all fields optional)."""

    condominium_id: Optional[int] = None
    operator_id: Optional[int] = None
    title: Optional[str] = None
    assembly_date: Optional[datetime] = None
    location: Optional[str] = None
    assembly_type: Optional[AssemblyType] = None
    status: Optional[AssemblyStatus] = None

    @field_validator("title")
    @classmethod
    def title_must_not_be_empty(cls, value: Optional[str]) -> Optional[str]:
        """Validate title if provided."""
        if value is not None and not value.strip():
            raise ValueError("Title cannot be empty")
        return value.strip() if value else None


class AssemblyResponse(AssemblyBase):
    """Schema for assembly response."""

    id: int
    status: AssemblyStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AssemblyUnitResponse(BaseModel):
    """Schema for assembly unit snapshot response."""

    id: int
    assembly_id: int
    unit_number: str
    owner_name: str
    ideal_fraction: float
    cpf_cnpj: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AssemblyUnitsListResponse(BaseModel):
    """Schema for assembly units list response."""

    items: list[AssemblyUnitResponse]
    total: int
    fraction_sum: float


class AssemblyListResponse(BaseModel):
    """Schema for paginated list of assemblies."""

    items: list[AssemblyResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
