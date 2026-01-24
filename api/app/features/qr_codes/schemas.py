"""Pydantic schemas for QR code CRUD operations."""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.core.enums import QRCodeStatus


class QRCodeBase(BaseModel):
    """Base schema with common fields."""

    visual_number: int


class QRCodeCreate(QRCodeBase):
    """Schema for creating a QR code."""


class QRCodeUpdate(BaseModel):
    """Schema for updating a QR code (all fields optional)."""

    visual_number: Optional[int] = None
    status: Optional[QRCodeStatus] = None


class QRCodeResponse(QRCodeBase):
    """Schema for QR code response."""

    id: int
    tenant_id: int
    token: UUID
    status: QRCodeStatus
    created_at: datetime
    deleted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class QRCodeListResponse(BaseModel):
    """Schema for paginated list of QR codes."""

    items: list[QRCodeResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
