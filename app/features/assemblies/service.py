"""Business logic for assembly CRUD operations."""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.enums import AssemblyStatus, CondominiumStatus
from app.features.assemblies.models import Assembly
from app.features.assemblies.schemas import AssemblyCreate, AssemblyUpdate
from app.features.condominiums.models import Condominium
from app.features.users.models import User


def _get_condominium(db: Session, condominium_id: int, tenant_id: int) -> Condominium:
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
    if condominium.status == CondominiumStatus.inactive:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive condominiums cannot receive new assemblies",
        )
    return condominium


def _get_operator(db: Session, operator_id: int, tenant_id: int) -> User:
    operator = (
        db.query(User)
        .filter(
            User.id == operator_id,
            User.tenant_id == tenant_id,
            User.deleted_at.is_(None),
        )
        .first()
    )
    if not operator:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Operator not found")
    return operator


def create_assembly(db: Session, assembly: AssemblyCreate, tenant_id: int) -> Assembly:
    """Create a new assembly."""
    _get_condominium(db, assembly.condominium_id, tenant_id)
    if assembly.operator_id is not None:
        _get_operator(db, assembly.operator_id, tenant_id)

    db_assembly = Assembly(
        condominium_id=assembly.condominium_id,
        operator_id=assembly.operator_id,
        title=assembly.title,
        assembly_date=assembly.assembly_date,
        location=assembly.location,
        assembly_type=assembly.assembly_type,
    )

    db.add(db_assembly)
    db.commit()
    db.refresh(db_assembly)

    return db_assembly


def _query_by_tenant(db: Session, tenant_id: int):
    return (
        db.query(Assembly)
        .join(Condominium, Assembly.condominium_id == Condominium.id)
        .filter(Condominium.tenant_id == tenant_id)
    )


def get_assembly(db: Session, assembly_id: int, tenant_id: int) -> Assembly:
    """Get assembly by ID (tenant isolated)."""
    assembly = _query_by_tenant(db, tenant_id).filter(Assembly.id == assembly_id).first()
    if not assembly:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assembly not found")
    return assembly


def list_assemblies(
    db: Session,
    tenant_id: int,
    skip: int = 0,
    limit: int = 100,
    cancelled_only: bool = False,
) -> tuple[list[Assembly], int]:
    """List assemblies with pagination (tenant isolated)."""
    query = _query_by_tenant(db, tenant_id)
    if cancelled_only:
        query = query.filter(Assembly.status == AssemblyStatus.cancelled)
    else:
        query = query.filter(Assembly.status != AssemblyStatus.cancelled)
    total = query.count()
    assemblies = query.order_by(Assembly.assembly_date.desc()).offset(skip).limit(limit).all()
    return assemblies, total


def update_assembly(
    db: Session,
    assembly_id: int,
    assembly_update: AssemblyUpdate,
    tenant_id: int,
) -> Assembly:
    """Update assembly fields."""
    assembly = get_assembly(db, assembly_id, tenant_id)

    update_data = assembly_update.model_dump(exclude_unset=True)
    if assembly.status == AssemblyStatus.cancelled:
        allowed_fields = {"status"}
        if not update_data:
            return assembly
        if set(update_data.keys()) - allowed_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cancelled assemblies can only change status",
            )

    if "condominium_id" in update_data:
        _get_condominium(db, update_data["condominium_id"], tenant_id)
    if "operator_id" in update_data and update_data["operator_id"] is not None:
        _get_operator(db, update_data["operator_id"], tenant_id)

    for field, value in update_data.items():
        setattr(assembly, field, value)

    db.commit()
    db.refresh(assembly)

    return assembly


def delete_assembly(db: Session, assembly_id: int, tenant_id: int) -> None:
    """Cancel assembly (soft delete)."""
    assembly = get_assembly(db, assembly_id, tenant_id)

    if assembly.status == AssemblyStatus.cancelled:
        return

    assembly.status = AssemblyStatus.cancelled
    db.commit()
