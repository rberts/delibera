"""Pydantic schemas for agenda CRUD operations."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.core.enums import AgendaStatus


class AgendaOptionBase(BaseModel):
    """Base schema for agenda vote options."""

    option_text: str
    display_order: int = Field(default=0, ge=0)

    @field_validator("option_text")
    @classmethod
    def option_text_must_not_be_empty(cls, value: str) -> str:
        """Validate option text is not empty."""
        if not value or not value.strip():
            raise ValueError("Option text cannot be empty")
        return value.strip()


class AgendaOptionCreate(AgendaOptionBase):
    """Schema for creating agenda options."""


class AgendaOptionResponse(AgendaOptionBase):
    """Schema for option response."""

    id: int
    agenda_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AgendaBase(BaseModel):
    """Base schema with common fields."""

    assembly_id: int
    title: str
    description: Optional[str] = None
    display_order: int = Field(default=0, ge=0)

    @field_validator("title")
    @classmethod
    def title_must_not_be_empty(cls, value: str) -> str:
        """Validate title is not empty."""
        if not value or not value.strip():
            raise ValueError("Title cannot be empty")
        return value.strip()


class AgendaCreate(AgendaBase):
    """Schema for creating an agenda."""

    options: list[AgendaOptionCreate]

    @model_validator(mode="after")
    def validate_options(self) -> "AgendaCreate":
        """Ensure agenda has at least two distinct options."""
        if len(self.options) < 2:
            raise ValueError("Agenda must have at least 2 options")

        display_orders = [option.display_order for option in self.options]
        if len(set(display_orders)) != len(display_orders):
            raise ValueError("Option display_order values must be unique")
        return self


class AgendaUpdate(BaseModel):
    """Schema for updating an agenda (all fields optional)."""

    title: Optional[str] = None
    description: Optional[str] = None
    display_order: Optional[int] = Field(default=None, ge=0)
    status: Optional[AgendaStatus] = None
    options: Optional[list[AgendaOptionCreate]] = None

    @field_validator("title")
    @classmethod
    def title_must_not_be_empty(cls, value: Optional[str]) -> Optional[str]:
        """Validate title if provided."""
        if value is not None and not value.strip():
            raise ValueError("Title cannot be empty")
        return value.strip() if value else None

    @model_validator(mode="after")
    def validate_options(self) -> "AgendaUpdate":
        """Validate options only when explicitly provided."""
        if self.options is None:
            return self
        if len(self.options) < 2:
            raise ValueError("Agenda must have at least 2 options")

        display_orders = [option.display_order for option in self.options]
        if len(set(display_orders)) != len(display_orders):
            raise ValueError("Option display_order values must be unique")
        return self


class AgendaResponse(AgendaBase):
    """Schema for agenda response."""

    id: int
    status: AgendaStatus
    opened_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    options: list[AgendaOptionResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class AgendaListResponse(BaseModel):
    """Schema for paginated list of agendas."""

    items: list[AgendaResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
