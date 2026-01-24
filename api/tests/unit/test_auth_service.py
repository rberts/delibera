"""Unit tests for authentication service."""
from __future__ import annotations

import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.enums import UserRole, UserStatus
from app.features.auth.security import hash_password
from app.features.auth.service import authenticate_user
from app.features.users.models import User


def _create_user(db_session: Session, email: str, status: UserStatus) -> User:
    user = User(
        tenant_id=1,
        name="Test User",
        email=email,
        password_hash=hash_password("secret"),
        role=UserRole.property_manager,
        status=status,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_authenticate_user_success(db_session: Session) -> None:
    user = _create_user(db_session, "auth.success@example.com", UserStatus.active)

    authenticated = authenticate_user(db_session, user.email, "secret")

    assert authenticated.id == user.id


def test_authenticate_user_invalid_password(db_session: Session) -> None:
    _create_user(db_session, "auth.fail@example.com", UserStatus.active)

    with pytest.raises(HTTPException) as exc:
        authenticate_user(db_session, "auth.fail@example.com", "wrong")

    assert exc.value.status_code == 401


def test_authenticate_user_inactive(db_session: Session) -> None:
    _create_user(db_session, "auth.inactive@example.com", UserStatus.inactive)

    with pytest.raises(HTTPException) as exc:
        authenticate_user(db_session, "auth.inactive@example.com", "secret")

    assert exc.value.status_code == 403
