"""Business logic for condominium CRUD operations."""
from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

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


def list_condominiums(db: Session, tenant_id: int, skip: int = 0, limit: int = 100) -> tuple[list[Condominium], int]:
    """List condominiums with pagination (tenant isolated)."""
    query = db.query(Condominium).filter(Condominium.tenant_id == tenant_id)

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
    for field, value in update_data.items():
        setattr(condominium, field, value)

    db.commit()
    db.refresh(condominium)

    return condominium


def delete_condominium(db: Session, condominium_id: int, tenant_id: int) -> None:
    """Delete condominium if no assemblies exist."""
    condominium = get_condominium(db, condominium_id, tenant_id)

    try:
        db.delete(condominium)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete condominium with existing assemblies",
        )
