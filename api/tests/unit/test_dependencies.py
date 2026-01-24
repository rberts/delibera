"""Unit tests for auth-related dependencies."""
from __future__ import annotations

import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.enums import UserRole, UserStatus
from app.core.dependencies import get_current_user, require_operator_or_manager, require_property_manager
from app.features.auth.security import create_access_token, hash_password
from app.features.users.models import User


def _create_user(db_session: Session, status: UserStatus, role: UserRole) -> User:
    user = User(
        tenant_id=1,
        name="Dep User",
        email=f"{role.value}-{status.value}@example.com",
        password_hash=hash_password("secret"),
        role=role,
        status=status,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.mark.asyncio
async def test_get_current_user_valid_token(db_session: Session) -> None:
    user = _create_user(db_session, UserStatus.active, UserRole.property_manager)
    token = create_access_token(user.id, user.tenant_id, user.role)

    current_user = await get_current_user(access_token=token, db=db_session)

    assert current_user.id == user.id


@pytest.mark.asyncio
async def test_get_current_user_inactive(db_session: Session) -> None:
    user = _create_user(db_session, UserStatus.inactive, UserRole.property_manager)
    token = create_access_token(user.id, user.tenant_id, user.role)

    with pytest.raises(HTTPException) as exc:
        await get_current_user(access_token=token, db=db_session)

    assert exc.value.status_code == 401


@pytest.mark.asyncio
async def test_require_property_manager_rejects_operator(db_session: Session) -> None:
    user = _create_user(db_session, UserStatus.active, UserRole.assembly_operator)

    with pytest.raises(HTTPException) as exc:
        await require_property_manager(current_user=user)

    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_require_operator_or_manager_accepts_manager(db_session: Session) -> None:
    user = _create_user(db_session, UserStatus.active, UserRole.property_manager)

    result = await require_operator_or_manager(current_user=user)

    assert result.id == user.id
