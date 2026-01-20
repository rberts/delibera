"""Pydantic schemas for agenda CRUD operations."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator

from app.core.enums import AgendaStatus


class AgendaBase(BaseModel):
    """Base schema with common fields."""

    assembly_id: int
    title: str
    description: Optional[str] = None
    display_order: int = 0

    @field_validator("title")
    @classmethod
    def title_must_not_be_empty(cls, value: str) -> str:
        """Validate title is not empty."""
        if not value or not value.strip():
            raise ValueError("Title cannot be empty")
        return value.strip()


class AgendaCreate(AgendaBase):
    """Schema for creating an agenda."""


class AgendaUpdate(BaseModel):
    """Schema for updating an agenda (all fields optional)."""

    title: Optional[str] = None
    description: Optional[str] = None
    display_order: Optional[int] = None
    status: Optional[AgendaStatus] = None

    @field_validator("title")
    @classmethod
    def title_must_not_be_empty(cls, value: Optional[str]) -> Optional[str]:
        """Validate title if provided."""
        if value is not None and not value.strip():
            raise ValueError("Title cannot be empty")
        return value.strip() if value else None


class AgendaResponse(AgendaBase):
    """Schema for agenda response."""

    id: int
    status: AgendaStatus
    opened_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AgendaListResponse(BaseModel):
    """Schema for paginated list of agendas."""

    items: list[AgendaResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
