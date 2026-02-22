"""Assembly CRUD endpoints."""
from math import ceil

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_tenant, require_property_manager
from app.features.assemblies import service
from app.features.assemblies.csv_processor import import_csv_units, preview_csv_import
from app.features.assemblies.schemas import (
    AssemblyCreate,
    AssemblyListResponse,
    AssemblyResponse,
    AssemblyUnitResponse,
    AssemblyUnitsListResponse,
    AssemblyUpdate,
)

router = APIRouter()


@router.post(
    "/",
    response_model=AssemblyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create assembly",
    dependencies=[Depends(require_property_manager)],
)
async def create_assembly(
    assembly: AssemblyCreate,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
) -> AssemblyResponse:
    """Create a new assembly."""
    db_assembly = service.create_assembly(db, assembly, tenant_id)
    return AssemblyResponse.model_validate(db_assembly)


@router.get(
    "/",
    response_model=AssemblyListResponse,
    summary="List assemblies",
)
async def list_assemblies(
    page: int = 1,
    page_size: int = 20,
    status: str = "active",
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
) -> AssemblyListResponse:
    """List assemblies with pagination."""
    page = max(1, page)
    page_size = min(page_size, 100)
    skip = (page - 1) * page_size

    if status not in {"active", "cancelled"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status filter")

    cancelled_only = status == "cancelled"
    assemblies, total = service.list_assemblies(db, tenant_id, skip, page_size, cancelled_only)

    return AssemblyListResponse(
        items=[AssemblyResponse.model_validate(a) for a in assemblies],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total > 0 else 0,
    )


@router.get(
    "/{assembly_id}",
    response_model=AssemblyResponse,
    summary="Get assembly",
)
async def get_assembly(
    assembly_id: int,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
) -> AssemblyResponse:
    """Get assembly by ID."""
    assembly = service.get_assembly(db, assembly_id, tenant_id)
    return AssemblyResponse.model_validate(assembly)


@router.get(
    "/{assembly_id}/units",
    response_model=AssemblyUnitsListResponse,
    summary="List imported assembly units",
)
async def list_units(
    assembly_id: int,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
) -> AssemblyUnitsListResponse:
    """List imported units for an assembly snapshot."""
    units, total, fraction_sum = service.list_assembly_units(db, assembly_id, tenant_id)
    return AssemblyUnitsListResponse(
        items=[AssemblyUnitResponse.model_validate(unit) for unit in units],
        total=total,
        fraction_sum=fraction_sum,
    )


@router.put(
    "/{assembly_id}",
    response_model=AssemblyResponse,
    summary="Update assembly",
    dependencies=[Depends(require_property_manager)],
)
async def update_assembly(
    assembly_id: int,
    assembly: AssemblyUpdate,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
) -> AssemblyResponse:
    """Update assembly."""
    db_assembly = service.update_assembly(db, assembly_id, assembly, tenant_id)
    return AssemblyResponse.model_validate(db_assembly)


@router.delete(
    "/{assembly_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete assembly",
    dependencies=[Depends(require_property_manager)],
)
async def delete_assembly(
    assembly_id: int,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
) -> None:
    """Delete assembly."""
    service.delete_assembly(db, assembly_id, tenant_id)


@router.post(
    "/{assembly_id}/units/preview",
    summary="Preview CSV import",
    dependencies=[Depends(require_property_manager)],
)
async def preview_units_import(
    assembly_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
) -> dict:
    """Preview CSV import (first 10 lines + validation)."""
    service.get_assembly(db, assembly_id, tenant_id)
    return await preview_csv_import(file, assembly_id)


@router.post(
    "/{assembly_id}/units/import",
    summary="Import units from CSV",
    dependencies=[Depends(require_property_manager)],
)
async def import_units(
    assembly_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
) -> dict:
    """Import units from CSV (creates immutable snapshot)."""
    service.get_assembly(db, assembly_id, tenant_id)
    units = await import_csv_units(db, file, assembly_id)
    return {
        "message": "Units imported successfully",
        "total_imported": len(units),
    }
