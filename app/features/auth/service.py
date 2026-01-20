"""Authentication business logic."""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.enums import UserStatus
from app.features.auth.security import verify_password
from app.features.users.models import User


def authenticate_user(db: Session, email: str, password: str) -> User:
    """Authenticate user by email and password."""
    user = db.query(User).filter(
        User.email == email,
        User.deleted_at.is_(None),
    ).first()

    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if user.status != UserStatus.active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is inactive",
        )

    return user
