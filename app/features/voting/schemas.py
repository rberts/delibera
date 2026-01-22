"""Pydantic schemas for voting operations."""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class VoteCastRequest(BaseModel):
    """Schema for casting a vote."""

    qr_token: UUID
    agenda_id: int
    option_id: int


class VoteResponse(BaseModel):
    """Schema for vote response."""

    id: int
    agenda_id: int
    assembly_unit_id: int
    option_id: int
    is_valid: bool
    invalidated_at: Optional[datetime] = None
    invalidated_by: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class VoteCastResponse(BaseModel):
    """Schema for vote cast summary."""

    agenda_id: int
    option_id: int
    votes_created: int
    vote_ids: List[int]


class QuorumResponse(BaseModel):
    """Schema for assembly quorum response."""

    total_units: int
    units_present: int
    fraction_present: float
    quorum_reached: bool


class OptionResult(BaseModel):
    """Schema for per-option voting result."""

    option_id: int
    option_text: str
    votes_count: int
    fraction_sum: float
    percentage: float


class AgendaResultsResponse(BaseModel):
    """Schema for agenda results response."""

    agenda_id: int
    total_units_present: int
    total_units_voted: int
    total_fraction_present: float
    total_fraction_voted: float
    results: List[OptionResult]
