"""Custom exceptions for domain-specific errors."""
from fastapi import HTTPException, status


class TenantIsolationError(HTTPException):
    """Raised when trying to access resources from another tenant."""

    def __init__(self, resource: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource} not found",
        )


class VoteAlreadyCastError(HTTPException):
    """Raised when unit tries to vote twice on same agenda."""

    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unit has already voted on this agenda",
        )


class QuorumNotReachedError(HTTPException):
    """Raised when trying to start assembly without quorum."""

    def __init__(self, fraction_present: float):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Quorum not reached (present: {fraction_present}%, required: 50%)",
        )


class AgendaNotOpenError(HTTPException):
    """Raised when trying to vote on closed agenda."""

    def __init__(self, status_value: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Agenda is {status_value}, not open for voting",
        )


class QRCodeAlreadyAssignedError(HTTPException):
    """Raised when trying to assign QR code already in use."""

    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="QR code is already assigned to this assembly",
        )
