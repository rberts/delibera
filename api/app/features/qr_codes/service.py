"""Business logic for QR code CRUD operations."""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.enums import QRCodeStatus
from app.features.qr_codes.models import QRCode
from app.features.qr_codes.schemas import QRCodeCreate, QRCodeUpdate


def create_qr_code(db: Session, qr_code: QRCodeCreate, tenant_id: int) -> QRCode:
    """Create a new QR code."""
    db_qr = QRCode(
        tenant_id=tenant_id,
        visual_number=qr_code.visual_number,
    )
    db.add(db_qr)
    db.commit()
    db.refresh(db_qr)
    return db_qr


def get_qr_code(db: Session, qr_code_id: int, tenant_id: int) -> QRCode:
    """Get QR code by ID (tenant isolated)."""
    qr_code = db.query(QRCode).filter(
        QRCode.id == qr_code_id,
        QRCode.tenant_id == tenant_id,
    ).first()

    if not qr_code:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="QR code not found")

    return qr_code


def list_qr_codes(
    db: Session,
    tenant_id: int,
    skip: int = 0,
    limit: int = 100,
    status_filter: QRCodeStatus = QRCodeStatus.active,
) -> tuple[list[QRCode], int]:
    """List QR codes with pagination (tenant isolated)."""
    query = db.query(QRCode).filter(
        QRCode.tenant_id == tenant_id,
        QRCode.status == status_filter,
    )
    total = query.count()
    qr_codes = query.order_by(QRCode.visual_number.asc()).offset(skip).limit(limit).all()
    return qr_codes, total


def update_qr_code(db: Session, qr_code_id: int, qr_code_update: QRCodeUpdate, tenant_id: int) -> QRCode:
    """Update QR code fields."""
    qr_code = get_qr_code(db, qr_code_id, tenant_id)
    update_data = qr_code_update.model_dump(exclude_unset=True)

    if qr_code.status == QRCodeStatus.inactive:
        allowed_fields = {"status"}
        if set(update_data.keys()) - allowed_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive QR codes can only change status",
            )

    for field, value in update_data.items():
        setattr(qr_code, field, value)

    db.commit()
    db.refresh(qr_code)
    return qr_code


def delete_qr_code(db: Session, qr_code_id: int, tenant_id: int) -> None:
    """Deactivate QR code by status change."""
    qr_code = get_qr_code(db, qr_code_id, tenant_id)
    if qr_code.status == QRCodeStatus.inactive:
        return
    qr_code.status = QRCodeStatus.inactive
    db.commit()
