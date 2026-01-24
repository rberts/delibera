"""Check-in endpoints."""
from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_tenant, get_current_user, require_operator_or_manager
from app.features.checkin import service
from app.features.checkin.schemas import (
    AttendanceListResponse,
    CheckInRequest,
    CheckInResponse,
    SelectUnitsByOwnerRequest,
)

router = APIRouter()


@router.post(
    "/assemblies/{assembly_id}/checkin",
    response_model=CheckInResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Check-in with QR code",
    dependencies=[Depends(require_operator_or_manager)],
)
async def checkin(
    assembly_id: int,
    checkin_data: CheckInRequest,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
    current_user=Depends(get_current_user),
) -> CheckInResponse:
    """Assign QR code to units (check-in process)."""
    assignment = service.assign_qr_code(
        db,
        assembly_id,
        checkin_data.qr_token,
        checkin_data.unit_ids,
        checkin_data.is_proxy,
        current_user.id,
        tenant_id,
    )
    return CheckInResponse.model_validate(assignment)


@router.delete(
    "/assignments/{assignment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Undo check-in",
    dependencies=[Depends(require_operator_or_manager)],
)
async def undo_checkin(
    assignment_id: int,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
) -> None:
    """Remove QR code assignment (undo check-in)."""
    service.unassign_qr_code(db, assignment_id, tenant_id)


@router.get(
    "/assemblies/{assembly_id}/attendance",
    response_model=AttendanceListResponse,
    summary="Get attendance list",
)
async def get_attendance(
    assembly_id: int,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
) -> AttendanceListResponse:
    """Get attendance list for assembly."""
    attendance = service.get_attendance_list(db, assembly_id, tenant_id)
    return AttendanceListResponse(items=attendance)


@router.post(
    "/assemblies/{assembly_id}/select-units-by-owner",
    response_model=List[int],
    summary="Select all units by owner",
)
async def select_units_by_owner(
    assembly_id: int,
    request: SelectUnitsByOwnerRequest,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
) -> List[int]:
    """Select all unit IDs for an owner in an assembly."""
    return service.select_units_by_owner(
        db,
        assembly_id,
        request.owner_name,
        tenant_id,
        request.cpf_cnpj,
    )
