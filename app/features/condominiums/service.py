"""Business logic for condominium CRUD operations."""
from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.enums import CondominiumStatus
from app.features.condominiums.models import Condominium
from app.features.condominiums.schemas import CondominiumCreate, CondominiumUpdate


def create_condominium(db: Session, condominium: CondominiumCreate, tenant_id: int) -> Condominium:
    """Create a new condominium."""
    db_condominium = Condominium(
        tenant_id=tenant_id,
        name=condominium.name,
        address=condominium.address,
    )

    db.add(db_condominium)
    db.commit()
    db.refresh(db_condominium)

    return db_condominium


def get_condominium(db: Session, condominium_id: int, tenant_id: int) -> Condominium:
    """Get condominium by ID (tenant isolated)."""
    condominium = (
        db.query(Condominium)
        .filter(
            Condominium.id == condominium_id,
            Condominium.tenant_id == tenant_id,
        )
        .first()
    )

    if not condominium:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Condominium not found")

    return condominium


def list_condominiums(
    db: Session,
    tenant_id: int,
    skip: int = 0,
    limit: int = 100,
    status_filter: CondominiumStatus = CondominiumStatus.active,
) -> tuple[list[Condominium], int]:
    """List condominiums with pagination (tenant isolated)."""
    query = db.query(Condominium).filter(Condominium.tenant_id == tenant_id)
    query = query.filter(Condominium.status == status_filter)

    total = query.count()
    condominiums = query.offset(skip).limit(limit).all()

    return condominiums, total


def update_condominium(
    db: Session,
    condominium_id: int,
    condominium_update: CondominiumUpdate,
    tenant_id: int,
) -> Condominium:
    """Update condominium fields."""
    condominium = get_condominium(db, condominium_id, tenant_id)

    update_data = condominium_update.model_dump(exclude_unset=True)
    if condominium.status == CondominiumStatus.inactive:
        allowed_fields = {"status"}
        if not update_data:
            return condominium
        if set(update_data.keys()) - allowed_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive condominiums can only change status",
            )
    for field, value in update_data.items():
        setattr(condominium, field, value)

    db.commit()
    db.refresh(condominium)

    return condominium


def delete_condominium(db: Session, condominium_id: int, tenant_id: int) -> None:
    """Deactivate condominium (soft delete)."""
    condominium = get_condominium(db, condominium_id, tenant_id)

    if condominium.status == CondominiumStatus.inactive:
        return

    condominium.status = CondominiumStatus.inactive

    try:
        db.commit()
        db.refresh(condominium)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate condominium with existing assemblies",
        )
