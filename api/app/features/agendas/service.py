"""Business logic for agenda CRUD operations."""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app.core.enums import AgendaStatus, AssemblyStatus
from app.features.agendas.models import Agenda
from app.features.agendas.schemas import AgendaCreate, AgendaUpdate
from app.features.assemblies.models import Assembly
from app.features.condominiums.models import Condominium


def _get_assembly(db: Session, assembly_id: int, tenant_id: int) -> Assembly:
    assembly = (
        db.query(Assembly)
        .join(Condominium, Assembly.condominium_id == Condominium.id)
        .filter(
            Assembly.id == assembly_id,
            Condominium.tenant_id == tenant_id,
        )
        .first()
    )
    if not assembly:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assembly not found")
    return assembly


def create_agenda(db: Session, agenda: AgendaCreate, tenant_id: int) -> Agenda:
    """Create a new agenda."""
    assembly = _get_assembly(db, agenda.assembly_id, tenant_id)
    if assembly.status == AssemblyStatus.cancelled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot add agenda to cancelled assembly")

    db_agenda = Agenda(
        assembly_id=agenda.assembly_id,
        title=agenda.title,
        description=agenda.description,
        display_order=agenda.display_order,
    )

    db.add(db_agenda)
    db.commit()
    db.refresh(db_agenda)

    return db_agenda


def get_agenda(db: Session, agenda_id: int, tenant_id: int) -> Agenda:
    """Get agenda by ID (tenant isolated)."""
    agenda = (
        db.query(Agenda)
        .join(Assembly, Agenda.assembly_id == Assembly.id)
        .join(Condominium, Assembly.condominium_id == Condominium.id)
        .filter(
            Agenda.id == agenda_id,
            Condominium.tenant_id == tenant_id,
        )
        .first()
    )

    if not agenda:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agenda not found")

    return agenda


def list_agendas(
    db: Session,
    tenant_id: int,
    skip: int = 0,
    limit: int = 100,
    include_cancelled: bool = False,
) -> tuple[list[Agenda], int]:
    """List agendas with pagination (tenant isolated)."""
    query = (
        db.query(Agenda)
        .join(Assembly, Agenda.assembly_id == Assembly.id)
        .join(Condominium, Assembly.condominium_id == Condominium.id)
        .filter(Condominium.tenant_id == tenant_id)
    )
    if not include_cancelled:
        query = query.filter(Agenda.status != AgendaStatus.cancelled)
    total = query.count()
    agendas = query.order_by(Agenda.display_order.asc()).offset(skip).limit(limit).all()
    return agendas, total


def update_agenda(db: Session, agenda_id: int, agenda_update: AgendaUpdate, tenant_id: int) -> Agenda:
    """Update agenda fields."""
    agenda = get_agenda(db, agenda_id, tenant_id)
    update_data = agenda_update.model_dump(exclude_unset=True)
    if agenda.status == AgendaStatus.cancelled:
        allowed_fields = {"status"}
        if set(update_data.keys()) - allowed_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cancelled agendas can only change status",
            )

    if "status" in update_data:
        new_status = update_data["status"]
        if new_status == AgendaStatus.open and update_data.get("opened_at") is None:
            update_data["opened_at"] = func.now()
        if new_status == AgendaStatus.closed:
            if update_data.get("opened_at") is None and agenda.opened_at is None:
                update_data["opened_at"] = func.now()
            if update_data.get("closed_at") is None:
                update_data["closed_at"] = func.now()

    for field, value in update_data.items():
        setattr(agenda, field, value)

    db.commit()
    db.refresh(agenda)

    return agenda


def delete_agenda(db: Session, agenda_id: int, tenant_id: int) -> None:
    """Cancel agenda (soft delete)."""
    agenda = get_agenda(db, agenda_id, tenant_id)
    if agenda.status == AgendaStatus.cancelled:
        return
    agenda.status = AgendaStatus.cancelled
    db.commit()
