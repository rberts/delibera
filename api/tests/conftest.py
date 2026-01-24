"""Global test fixtures for backend integration tests."""
from __future__ import annotations

import os
from uuid import uuid4
from typing import Generator

import pytest
from sqlalchemy import event
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret-key")

from app.core import database as core_database  # noqa: E402
from app.core.enums import UserRole, UserStatus  # noqa: E402
from app.features.auth.security import hash_password  # noqa: E402
from app.features.tenants.models import Tenant  # noqa: E402
from app.features.users.models import User  # noqa: E402
from app.main import app  # noqa: E402
from app.core.database import get_db  # noqa: E402
from app import models  # noqa: F401, E402


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    """Create a fresh database session for each test."""
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    if engine.dialect.name == "sqlite":
        def _sqlite_uuid() -> str:
            return str(uuid4())

        def _register_sqlite_uuid(dbapi_connection, _connection_record) -> None:
            dbapi_connection.create_function("gen_random_uuid", 0, _sqlite_uuid)

        event.listen(engine, "connect", _register_sqlite_uuid)

    core_database.engine = engine
    core_database.SessionLocal = TestingSessionLocal

    if engine.dialect.name == "sqlite":
        for table_name in ("tenants", "users"):
            table = core_database.Base.metadata.tables.get(table_name)
            if table is None:
                continue
            for constraint in list(table.constraints):
                if constraint.name in {"chk_tenant_email", "chk_user_email"}:
                    table.constraints.remove(constraint)

    core_database.Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        core_database.Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """FastAPI TestClient with database override."""
    def override_get_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def sample_tenant(db_session: Session) -> Tenant:
    """Create a sample tenant."""
    tenant = Tenant(
        name="Test Admin",
        email="tenant@example.com",
        password_hash=hash_password("tenant-pass"),
    )
    db_session.add(tenant)
    db_session.commit()
    db_session.refresh(tenant)
    return tenant


@pytest.fixture()
def sample_user(db_session: Session, sample_tenant: Tenant) -> User:
    """Create a sample property manager user."""
    user = User(
        tenant_id=sample_tenant.id,
        name="Test User",
        email="user@example.com",
        password_hash=hash_password("test123"),
        role=UserRole.property_manager,
        status=UserStatus.active,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def authenticated_client(client: TestClient, sample_user: User) -> TestClient:
    """Authenticate the test client via login."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": sample_user.email, "password": "test123"},
    )
    assert response.status_code == 200
    return client
