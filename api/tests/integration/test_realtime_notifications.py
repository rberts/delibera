"""Integration tests for SSE notifications."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import uuid4
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.enums import AgendaStatus, AssemblyType
from app.features.agendas.models import Agenda, AgendaOption
from app.features.assemblies.models import Assembly, AssemblyUnit
from app.features.condominiums.models import Condominium
from app.features.qr_codes.models import QRCode
from app.features.users.models import User


def _create_assembly(db_session: Session, tenant_id: int, operator_id: int) -> Assembly:
    condominium = Condominium(tenant_id=tenant_id, name="Condo SSE", address="Rua A")
    db_session.add(condominium)
    db_session.flush()

    assembly = Assembly(
        condominium_id=condominium.id,
        operator_id=operator_id,
        title="Assembleia SSE",
        assembly_date=datetime.now(timezone.utc) + timedelta(days=1),
        location="Salao",
        assembly_type=AssemblyType.ordinary,
    )
    db_session.add(assembly)
    db_session.flush()
    return assembly


def _create_units(db_session: Session, assembly_id: int) -> list[AssemblyUnit]:
    units = [
        AssemblyUnit(
            assembly_id=assembly_id,
            unit_number="101",
            owner_name="Owner A",
            ideal_fraction=2.5,
            cpf_cnpj="123.456.789-09",
        ),
        AssemblyUnit(
            assembly_id=assembly_id,
            unit_number="102",
            owner_name="Owner B",
            ideal_fraction=2.5,
            cpf_cnpj="12.345.678/0001-95",
        ),
    ]
    db_session.add_all(units)
    db_session.flush()
    return units


def _create_qr_code(db_session: Session, tenant_id: int) -> QRCode:
    qr = QRCode(tenant_id=tenant_id, visual_number=1, token=uuid4())
    db_session.add(qr)
    db_session.flush()
    return qr


def _create_agenda(db_session: Session, assembly_id: int) -> tuple[Agenda, AgendaOption]:
    agenda = Agenda(
        assembly_id=assembly_id,
        title="Aprovacao",
        description="Teste",
        display_order=1,
    )
    db_session.add(agenda)
    db_session.flush()
    option_yes = AgendaOption(agenda_id=agenda.id, option_text="Sim", display_order=1)
    db_session.add(option_yes)
    db_session.flush()
    return agenda, option_yes


@pytest.mark.asyncio
async def test_checkin_triggers_notification(
    authenticated_client: TestClient,
    db_session: Session,
    sample_user: User,
    sample_tenant,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    captured: list[tuple[int, int, float]] = []

    async def _capture(assembly_id: int, units_present: int, fraction_present: float) -> None:
        captured.append((assembly_id, units_present, fraction_present))

    monkeypatch.setattr("app.features.checkin.router.notify_checkin", _capture)

    assembly = _create_assembly(db_session, sample_tenant.id, sample_user.id)
    units = _create_units(db_session, assembly.id)
    qr = _create_qr_code(db_session, sample_tenant.id)
    db_session.commit()

    response = authenticated_client.post(
        f"/api/v1/checkin/assemblies/{assembly.id}/checkin",
        json={
            "qr_token": str(qr.token),
            "unit_ids": [unit.id for unit in units],
            "is_proxy": False,
        },
    )
    assert response.status_code == 201
    assert captured
    assert captured[-1][0] == assembly.id
    assert captured[-1][1] == len(units)


@pytest.mark.asyncio
async def test_agenda_status_triggers_notification(
    authenticated_client: TestClient,
    db_session: Session,
    sample_user: User,
    sample_tenant,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    captured: list[tuple[int, int, str]] = []

    async def _capture(assembly_id: int, agenda_id: int, status_value: str) -> None:
        captured.append((assembly_id, agenda_id, status_value))

    monkeypatch.setattr("app.features.agendas.router.notify_agenda_status", _capture)

    assembly = _create_assembly(db_session, sample_tenant.id, sample_user.id)
    agenda, _ = _create_agenda(db_session, assembly.id)
    db_session.commit()

    response = authenticated_client.put(
        f"/api/v1/agendas/{agenda.id}",
        json={"status": "open"},
    )
    assert response.status_code == 200
    assert captured
    assert captured[-1] == (assembly.id, agenda.id, "open")


@pytest.mark.asyncio
async def test_vote_triggers_notification(
    authenticated_client: TestClient,
    db_session: Session,
    sample_user: User,
    sample_tenant,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    captured: list[tuple[int, int, int]] = []

    async def _capture(assembly_id: int, agenda_id: int, votes_count: int) -> None:
        captured.append((assembly_id, agenda_id, votes_count))

    monkeypatch.setattr("app.features.voting.router.notify_vote_cast", _capture)

    assembly = _create_assembly(db_session, sample_tenant.id, sample_user.id)
    units = _create_units(db_session, assembly.id)
    qr = _create_qr_code(db_session, sample_tenant.id)
    agenda, option_yes = _create_agenda(db_session, assembly.id)
    agenda.status = AgendaStatus.open
    agenda.opened_at = datetime.now(timezone.utc)
    db_session.flush()
    db_session.commit()

    # Check-in required before voting
    checkin_response = authenticated_client.post(
        f"/api/v1/checkin/assemblies/{assembly.id}/checkin",
        json={"qr_token": str(qr.token), "unit_ids": [units[0].id], "is_proxy": False},
    )
    assert checkin_response.status_code == 201

    response = authenticated_client.post(
        "/api/v1/voting/vote",
        json={"qr_token": str(qr.token), "agenda_id": agenda.id, "option_id": option_yes.id},
    )
    assert response.status_code == 201
    assert captured
    assert captured[-1][0] == assembly.id
    assert captured[-1][1] == agenda.id
    assert captured[-1][2] >= 1
