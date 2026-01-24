"""QR code CRUD endpoints."""
from math import ceil

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_tenant, require_property_manager
from app.core.enums import QRCodeStatus
from app.features.qr_codes import service
from app.features.qr_codes.schemas import (
    QRCodeCreate,
    QRCodeListResponse,
    QRCodeResponse,
    QRCodeUpdate,
)

router = APIRouter()


@router.post(
    "/",
    response_model=QRCodeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create QR code",
    dependencies=[Depends(require_property_manager)],
)
async def create_qr_code(
    qr_code: QRCodeCreate,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
) -> QRCodeResponse:
    """Create a new QR code."""
    db_qr = service.create_qr_code(db, qr_code, tenant_id)
    return QRCodeResponse.model_validate(db_qr)


@router.get(
    "/",
    response_model=QRCodeListResponse,
    summary="List QR codes",
    dependencies=[Depends(require_property_manager)],
)
async def list_qr_codes(
    page: int = 1,
    page_size: int = 20,
    status: str = "active",
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
) -> QRCodeListResponse:
    """List QR codes with pagination."""
    page = max(1, page)
    page_size = min(page_size, 100)
    skip = (page - 1) * page_size

    try:
        status_filter = QRCodeStatus(status)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status filter") from exc

    qr_codes, total = service.list_qr_codes(db, tenant_id, skip, page_size, status_filter)

    return QRCodeListResponse(
        items=[QRCodeResponse.model_validate(q) for q in qr_codes],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total > 0 else 0,
    )


@router.get(
    "/{qr_code_id}",
    response_model=QRCodeResponse,
    summary="Get QR code",
    dependencies=[Depends(require_property_manager)],
)
async def get_qr_code(
    qr_code_id: int,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
) -> QRCodeResponse:
    """Get QR code by ID."""
    qr_code = service.get_qr_code(db, qr_code_id, tenant_id)
    return QRCodeResponse.model_validate(qr_code)


@router.put(
    "/{qr_code_id}",
    response_model=QRCodeResponse,
    summary="Update QR code",
    dependencies=[Depends(require_property_manager)],
)
async def update_qr_code(
    qr_code_id: int,
    qr_code: QRCodeUpdate,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
) -> QRCodeResponse:
    """Update QR code."""
    db_qr = service.update_qr_code(db, qr_code_id, qr_code, tenant_id)
    return QRCodeResponse.model_validate(db_qr)


@router.delete(
    "/{qr_code_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deactivate QR code",
    dependencies=[Depends(require_property_manager)],
)
async def delete_qr_code(
    qr_code_id: int,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
) -> None:
    """Deactivate QR code."""
    service.delete_qr_code(db, qr_code_id, tenant_id)
