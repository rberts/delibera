"""Database seed script for initial tenant, admin user, and condominium."""
from __future__ import annotations

import os
import sys

from sqlalchemy.exc import SQLAlchemyError

from app.core.database import SessionLocal
from app.core.enums import UserRole, UserStatus, CondominiumStatus
from app.features.auth.security import hash_password
from app.features.condominiums.models import Condominium
from app.features.tenants.models import Tenant
from app.features.users.models import User


def _env(name: str, default: str) -> str:
    value = os.getenv(name)
    return value if value is not None and value.strip() != "" else default


def seed() -> int:
    """Create initial tenant, admin user, and condominium if missing."""
    admin_email = _env("SEED_ADMIN_EMAIL", "admin@demo.com")
    admin_password = _env("SEED_ADMIN_PASSWORD", "qwe123")
    admin_name = _env("SEED_ADMIN_NAME", "Admin")

    tenant_name = _env("SEED_TENANT_NAME", "Condomínio TCA")
    tenant_email = _env("SEED_TENANT_EMAIL", admin_email)
    tenant_password = _env("SEED_TENANT_PASSWORD", admin_password)

    condominium_name = _env("SEED_CONDOMINIUM_NAME", "Condomínio TCA")
    condominium_address = _env("SEED_CONDOMINIUM_ADDRESS", "Endereco nao informado")

    db = SessionLocal()
    try:
        tenant = db.query(Tenant).filter(Tenant.email == tenant_email).first()
        if tenant is None:
            tenant = Tenant(
                name=tenant_name,
                email=tenant_email,
                password_hash=hash_password(tenant_password),
            )
            db.add(tenant)
            db.flush()

        user = (
            db.query(User)
            .filter(User.email == admin_email, User.tenant_id == tenant.id)
            .first()
        )
        if user is None:
            user = User(
                tenant_id=tenant.id,
                name=admin_name,
                email=admin_email,
                password_hash=hash_password(admin_password),
                role=UserRole.property_manager,
                status=UserStatus.active,
            )
            db.add(user)

        condominium = (
            db.query(Condominium)
            .filter(
                Condominium.tenant_id == tenant.id,
                Condominium.name == condominium_name,
            )
            .first()
        )
        if condominium is None:
            condominium = Condominium(
                tenant_id=tenant.id,
                name=condominium_name,
                address=condominium_address,
                status=CondominiumStatus.active,
            )
            db.add(condominium)

        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        print(f"Seed failed: {exc}", file=sys.stderr)
        return 1
    finally:
        db.close()

    print("Seed completed successfully.")
    return 0


if __name__ == "__main__":
    raise SystemExit(seed())
