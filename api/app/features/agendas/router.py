"""Agenda CRUD endpoints."""
from math import ceil

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_tenant, require_property_manager
from app.features.agendas import service
from app.features.realtime.sse import notify_agenda_status
from app.features.agendas.schemas import AgendaCreate, AgendaListResponse, AgendaResponse, AgendaUpdate

router = APIRouter()


@router.post(
    "/",
    response_model=AgendaResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create agenda",
    dependencies=[Depends(require_property_manager)],
)
async def create_agenda(
    agenda: AgendaCreate,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
) -> AgendaResponse:
    """Create a new agenda."""
    db_agenda = service.create_agenda(db, agenda, tenant_id)
    return AgendaResponse.model_validate(db_agenda)


@router.get(
    "/",
    response_model=AgendaListResponse,
    summary="List agendas",
    dependencies=[Depends(require_property_manager)],
)
async def list_agendas(
    page: int = 1,
    page_size: int = 20,
    include_cancelled: bool = False,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
) -> AgendaListResponse:
    """List agendas with pagination."""
    page = max(1, page)
    page_size = min(page_size, 100)
    skip = (page - 1) * page_size

    agendas, total = service.list_agendas(db, tenant_id, skip, page_size, include_cancelled)

    return AgendaListResponse(
        items=[AgendaResponse.model_validate(a) for a in agendas],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total > 0 else 0,
    )


@router.get(
    "/{agenda_id}",
    response_model=AgendaResponse,
    summary="Get agenda",
    dependencies=[Depends(require_property_manager)],
)
async def get_agenda(
    agenda_id: int,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
) -> AgendaResponse:
    """Get agenda by ID."""
    agenda = service.get_agenda(db, agenda_id, tenant_id)
    return AgendaResponse.model_validate(agenda)


@router.put(
    "/{agenda_id}",
    response_model=AgendaResponse,
    summary="Update agenda",
    dependencies=[Depends(require_property_manager)],
)
async def update_agenda(
    agenda_id: int,
    agenda: AgendaUpdate,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
) -> AgendaResponse:
    """Update agenda."""
    existing_agenda = service.get_agenda(db, agenda_id, tenant_id)
    previous_status = existing_agenda.status
    db_agenda = service.update_agenda(db, agenda_id, agenda, tenant_id)
    if db_agenda.status != previous_status:
        await notify_agenda_status(db_agenda.assembly_id, db_agenda.id, db_agenda.status.value)
    return AgendaResponse.model_validate(db_agenda)


@router.delete(
    "/{agenda_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Cancel agenda",
    dependencies=[Depends(require_property_manager)],
)
async def delete_agenda(
    agenda_id: int,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
) -> None:
    """Cancel agenda."""
    service.delete_agenda(db, agenda_id, tenant_id)
