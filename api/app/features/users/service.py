"""Business logic for user CRUD operations."""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.enums import UserStatus
from app.features.auth.security import hash_password
from app.features.users.models import User
from app.features.users.schemas import UserCreate, UserUpdate


def _get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email, User.deleted_at.is_(None)).first()


def create_user(db: Session, user: UserCreate, tenant_id: int) -> User:
    """Create a new user."""
    if _get_user_by_email(db, user.email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already in use")

    db_user = User(
        tenant_id=tenant_id,
        name=user.name,
        email=user.email,
        role=user.role,
        password_hash=hash_password(user.password),
        status=UserStatus.active,
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


def get_user(db: Session, user_id: int, tenant_id: int) -> User:
    """Get user by ID (tenant isolated, excluding deleted)."""
    user = db.query(User).filter(
        User.id == user_id,
        User.tenant_id == tenant_id,
        User.deleted_at.is_(None),
    ).first()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return user


def list_users(
    db: Session,
    tenant_id: int,
    skip: int = 0,
    limit: int = 100,
    status_filter: UserStatus = UserStatus.active,
) -> tuple[list[User], int]:
    """List users with pagination (tenant isolated)."""
    query = db.query(User).filter(
        User.tenant_id == tenant_id,
        User.deleted_at.is_(None),
        User.status == status_filter,
    )
    total = query.count()
    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    return users, total


def update_user(db: Session, user_id: int, user_update: UserUpdate, tenant_id: int) -> User:
    """Update user fields."""
    user = get_user(db, user_id, tenant_id)
    update_data = user_update.model_dump(exclude_unset=True)

    if "email" in update_data:
        existing = _get_user_by_email(db, update_data["email"])
        if existing and existing.id != user.id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already in use")

    if "password" in update_data:
        update_data["password_hash"] = hash_password(update_data.pop("password"))

    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)

    return user


def delete_user(db: Session, user_id: int, tenant_id: int) -> None:
    """Deactivate user."""
    user = get_user(db, user_id, tenant_id)
    if user.status == UserStatus.inactive:
        return
    user.status = UserStatus.inactive
    db.commit()
