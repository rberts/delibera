"""Integration tests for check-in router payload and QR identifier resolution."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.enums import AssemblyType, QRCodeStatus
from app.features.assemblies.models import Assembly, AssemblyUnit
from app.features.condominiums.models import Condominium
from app.features.qr_codes.models import QRCode
from app.features.users.models import User


def _create_assembly(db_session: Session, tenant_id: int, operator_id: int) -> Assembly:
    condominium = Condominium(tenant_id=tenant_id, name="Condo Checkin", address="Rua B")
    db_session.add(condominium)
    db_session.flush()

    assembly = Assembly(
        condominium_id=condominium.id,
        operator_id=operator_id,
        title="Assembleia Checkin",
        assembly_date=datetime.now(timezone.utc) + timedelta(days=1),
        location="Salao",
        assembly_type=AssemblyType.ordinary,
    )
    db_session.add(assembly)
    db_session.flush()
    return assembly


def _create_unit(db_session: Session, assembly_id: int, unit_number: str) -> AssemblyUnit:
    unit = AssemblyUnit(
        assembly_id=assembly_id,
        unit_number=unit_number,
        owner_name=f"Owner {unit_number}",
        ideal_fraction=2.5,
        cpf_cnpj=f"123.456.789-{unit_number.zfill(2)}",
    )
    db_session.add(unit)
    db_session.flush()
    return unit


def _create_qr_code(
    db_session: Session,
    tenant_id: int,
    visual_number: int,
    *,
    status: QRCodeStatus = QRCodeStatus.active,
) -> QRCode:
    qr = QRCode(
        tenant_id=tenant_id,
        visual_number=visual_number,
        token=uuid4(),
        status=status,
    )
    db_session.add(qr)
    db_session.flush()
    return qr


def test_checkin_accepts_qr_token(
    authenticated_client: TestClient,
    db_session: Session,
    sample_user: User,
    sample_tenant,
) -> None:
    assembly = _create_assembly(db_session, sample_tenant.id, sample_user.id)
    unit = _create_unit(db_session, assembly.id, "101")
    qr = _create_qr_code(db_session, sample_tenant.id, 1)
    db_session.commit()

    response = authenticated_client.post(
        f"/api/v1/checkin/assemblies/{assembly.id}/checkin",
        json={
            "qr_token": str(qr.token),
            "unit_ids": [unit.id],
            "is_proxy": False,
        },
    )
    assert response.status_code == 201


def test_checkin_accepts_qr_visual_number(
    authenticated_client: TestClient,
    db_session: Session,
    sample_user: User,
    sample_tenant,
) -> None:
    assembly = _create_assembly(db_session, sample_tenant.id, sample_user.id)
    unit = _create_unit(db_session, assembly.id, "102")
    _create_qr_code(db_session, sample_tenant.id, 5)
    db_session.commit()

    response = authenticated_client.post(
        f"/api/v1/checkin/assemblies/{assembly.id}/checkin",
        json={
            "qr_visual_number": 5,
            "unit_ids": [unit.id],
            "is_proxy": False,
        },
    )
    assert response.status_code == 201


def test_checkin_rejects_payload_without_qr_identifier(
    authenticated_client: TestClient,
    db_session: Session,
    sample_user: User,
    sample_tenant,
) -> None:
    assembly = _create_assembly(db_session, sample_tenant.id, sample_user.id)
    unit = _create_unit(db_session, assembly.id, "103")
    db_session.commit()

    response = authenticated_client.post(
        f"/api/v1/checkin/assemblies/{assembly.id}/checkin",
        json={"unit_ids": [unit.id], "is_proxy": False},
    )
    assert response.status_code == 422


def test_checkin_rejects_payload_with_both_qr_identifiers(
    authenticated_client: TestClient,
    db_session: Session,
    sample_user: User,
    sample_tenant,
) -> None:
    assembly = _create_assembly(db_session, sample_tenant.id, sample_user.id)
    unit = _create_unit(db_session, assembly.id, "104")
    qr = _create_qr_code(db_session, sample_tenant.id, 7)
    db_session.commit()

    response = authenticated_client.post(
        f"/api/v1/checkin/assemblies/{assembly.id}/checkin",
        json={
            "qr_token": str(qr.token),
            "qr_visual_number": qr.visual_number,
            "unit_ids": [unit.id],
            "is_proxy": False,
        },
    )
    assert response.status_code == 422


def test_checkin_returns_404_for_missing_or_inactive_visual_number(
    authenticated_client: TestClient,
    db_session: Session,
    sample_user: User,
    sample_tenant,
) -> None:
    assembly = _create_assembly(db_session, sample_tenant.id, sample_user.id)
    unit = _create_unit(db_session, assembly.id, "105")
    _create_qr_code(db_session, sample_tenant.id, 9, status=QRCodeStatus.inactive)
    db_session.commit()

    missing_response = authenticated_client.post(
        f"/api/v1/checkin/assemblies/{assembly.id}/checkin",
        json={
            "qr_visual_number": 999,
            "unit_ids": [unit.id],
            "is_proxy": False,
        },
    )
    assert missing_response.status_code == 404

    inactive_response = authenticated_client.post(
        f"/api/v1/checkin/assemblies/{assembly.id}/checkin",
        json={
            "qr_visual_number": 9,
            "unit_ids": [unit.id],
            "is_proxy": False,
        },
    )
    assert inactive_response.status_code == 404
