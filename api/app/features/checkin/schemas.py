"""Pydantic schemas for check-in operations."""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator, model_validator


class CheckInRequest(BaseModel):
    """Schema for check-in request payload."""

    qr_token: Optional[UUID] = None
    qr_visual_number: Optional[int] = None
    unit_ids: List[int]
    is_proxy: bool = False

    @model_validator(mode="after")
    def validate_qr_identifier(self) -> "CheckInRequest":
        has_token = self.qr_token is not None
        has_visual_number = self.qr_visual_number is not None
        if has_token == has_visual_number:
            raise ValueError("Provide exactly one of qr_token or qr_visual_number")
        return self

    @field_validator("unit_ids")
    @classmethod
    def validate_unit_ids(cls, value: List[int]) -> List[int]:
        if not value:
            raise ValueError("unit_ids must not be empty")
        if len(value) != len(set(value)):
            raise ValueError("unit_ids must be unique")
        return value

    @field_validator("qr_visual_number")
    @classmethod
    def validate_qr_visual_number(cls, value: Optional[int]) -> Optional[int]:
        if value is not None and value <= 0:
            raise ValueError("qr_visual_number must be greater than zero")
        return value


class CheckInResponse(BaseModel):
    """Schema for check-in response."""

    id: int
    assembly_id: int
    qr_code_id: int
    is_proxy: bool
    assigned_at: datetime
    assigned_by: int

    model_config = ConfigDict(from_attributes=True)


class AttendanceUnit(BaseModel):
    """Schema for unit details in attendance list."""

    id: int
    unit_number: str
    owner_name: str
    ideal_fraction: float
    cpf_cnpj: str


class AttendanceItem(BaseModel):
    """Schema for attendance list item."""

    assignment_id: int
    qr_visual_number: int
    is_proxy: bool
    units: List[AttendanceUnit]
    owner_names: List[str]
    total_fraction: float


class AttendanceListResponse(BaseModel):
    """Schema for attendance list response."""

    items: List[AttendanceItem]


class SelectUnitsByOwnerRequest(BaseModel):
    """Schema to select all units by owner."""

    owner_name: str
    cpf_cnpj: Optional[str] = None

    @field_validator("owner_name")
    @classmethod
    def owner_name_must_not_be_empty(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("owner_name cannot be empty")
        return value.strip()
