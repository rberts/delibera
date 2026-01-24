"""User CRUD endpoints."""
from math import ceil

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_tenant, require_property_manager
from app.core.enums import UserStatus
from app.features.users import service
from app.features.users.schemas import UserCreate, UserListResponse, UserResponse, UserUpdate

router = APIRouter()


@router.post(
    "/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create user",
    dependencies=[Depends(require_property_manager)],
)
async def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
) -> UserResponse:
    """Create a new user."""
    db_user = service.create_user(db, user, tenant_id)
    return UserResponse.model_validate(db_user)


@router.get(
    "/",
    response_model=UserListResponse,
    summary="List users",
    dependencies=[Depends(require_property_manager)],
)
async def list_users(
    page: int = 1,
    page_size: int = 20,
    status: str = "active",
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
) -> UserListResponse:
    """List users with pagination."""
    page = max(1, page)
    page_size = min(page_size, 100)
    skip = (page - 1) * page_size

    try:
        status_filter = UserStatus(status)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status filter") from exc

    users, total = service.list_users(db, tenant_id, skip, page_size, status_filter)

    return UserListResponse(
        items=[UserResponse.model_validate(u) for u in users],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total > 0 else 0,
    )


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="Get user",
    dependencies=[Depends(require_property_manager)],
)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
) -> UserResponse:
    """Get user by ID."""
    user = service.get_user(db, user_id, tenant_id)
    return UserResponse.model_validate(user)


@router.put(
    "/{user_id}",
    response_model=UserResponse,
    summary="Update user",
    dependencies=[Depends(require_property_manager)],
)
async def update_user(
    user_id: int,
    user: UserUpdate,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
) -> UserResponse:
    """Update user."""
    db_user = service.update_user(db, user_id, user, tenant_id)
    return UserResponse.model_validate(db_user)


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deactivate user",
    dependencies=[Depends(require_property_manager)],
)
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
) -> None:
    """Deactivate user."""
    service.delete_user(db, user_id, tenant_id)
