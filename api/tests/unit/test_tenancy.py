"""Unit tests for tenancy helpers."""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.enums import CondominiumStatus
from app.core.tenancy import filter_by_tenant
from app.features.condominiums.models import Condominium


def test_filter_by_tenant_limits_results(db_session: Session) -> None:
    condo_a = Condominium(tenant_id=1, name="A", address="Rua A", status=CondominiumStatus.active)
    condo_b = Condominium(tenant_id=2, name="B", address="Rua B", status=CondominiumStatus.active)
    db_session.add_all([condo_a, condo_b])
    db_session.commit()

    results = filter_by_tenant(db_session.query(Condominium), Condominium, tenant_id=1).all()

    assert len(results) == 1
    assert results[0].tenant_id == 1
