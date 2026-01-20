"""Condominium CRUD endpoints."""
from math import ceil

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_tenant, require_property_manager
from app.core.enums import CondominiumStatus
from app.features.condominiums import service
from app.features.condominiums.schemas import (
    CondominiumCreate,
    CondominiumListResponse,
    CondominiumResponse,
    CondominiumUpdate,
)

router = APIRouter()


@router.post(
    "/",
    response_model=CondominiumResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create condominium",
    dependencies=[Depends(require_property_manager)],
)
async def create_condominium(
    condominium: CondominiumCreate,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
) -> CondominiumResponse:
    """Create a new condominium."""
    db_condominium = service.create_condominium(db, condominium, tenant_id)
    return CondominiumResponse.model_validate(db_condominium)


@router.get(
    "/",
    response_model=CondominiumListResponse,
    summary="List condominiums",
)
async def list_condominiums(
    page: int = 1,
    page_size: int = 20,
    status: str = "active",
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
) -> CondominiumListResponse:
    """List condominiums with pagination."""
    page = max(1, page)
    page_size = min(page_size, 100)
    skip = (page - 1) * page_size

    try:
        status_filter = CondominiumStatus(status)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status filter") from exc

    condominiums, total = service.list_condominiums(db, tenant_id, skip, page_size, status_filter)

    return CondominiumListResponse(
        items=[CondominiumResponse.model_validate(c) for c in condominiums],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total > 0 else 0,
    )


@router.get(
    "/{condominium_id}",
    response_model=CondominiumResponse,
    summary="Get condominium",
)
async def get_condominium(
    condominium_id: int,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
) -> CondominiumResponse:
    """Get condominium by ID."""
    condominium = service.get_condominium(db, condominium_id, tenant_id)
    return CondominiumResponse.model_validate(condominium)


@router.put(
    "/{condominium_id}",
    response_model=CondominiumResponse,
    summary="Update condominium",
    dependencies=[Depends(require_property_manager)],
)
async def update_condominium(
    condominium_id: int,
    condominium: CondominiumUpdate,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
) -> CondominiumResponse:
    """Update condominium."""
    db_condominium = service.update_condominium(db, condominium_id, condominium, tenant_id)
    return CondominiumResponse.model_validate(db_condominium)


@router.delete(
    "/{condominium_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deactivate condominium",
    dependencies=[Depends(require_property_manager)],
)
async def delete_condominium(
    condominium_id: int,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
) -> None:
    """Deactivate condominium."""
    service.delete_condominium(db, condominium_id, tenant_id)
