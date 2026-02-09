"""Integration tests for public voting status endpoint."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.enums import AgendaStatus, AssemblyType, QRCodeStatus, UserRole, UserStatus
from app.features.agendas.models import Agenda, AgendaOption
from app.features.assemblies.models import Assembly, AssemblyUnit
from app.features.checkin.models import QRCodeAssignedUnit, QRCodeAssignment
from app.features.condominiums.models import Condominium
from app.features.qr_codes.models import QRCode
from app.features.users.models import User


def _seed_user(db_session: Session, tenant_id: int) -> User:
    user = User(
        tenant_id=tenant_id,
        name="Operator",
        email=f"operator-status-{tenant_id}@example.com",
        password_hash="hash",
        role=UserRole.assembly_operator,
        status=UserStatus.active,
    )
    db_session.add(user)
    db_session.flush()
    return user


def _seed_context(
    db_session: Session,
    tenant_id: int = 1,
    *,
    with_assignment: bool = True,
    qr_status: QRCodeStatus = QRCodeStatus.active,
    agenda_status: AgendaStatus = AgendaStatus.open,
) -> dict:
    condominium = Condominium(tenant_id=tenant_id, name="Condo Voting", address="Rua A")
    db_session.add(condominium)
    db_session.flush()

    user = _seed_user(db_session, tenant_id)

    assembly = Assembly(
        condominium_id=condominium.id,
        operator_id=user.id,
        title="Assembleia Publica",
        assembly_date=datetime.now(timezone.utc) + timedelta(days=1),
        location="Salao",
        assembly_type=AssemblyType.ordinary,
    )
    db_session.add(assembly)
    db_session.flush()

    unit = AssemblyUnit(
        assembly_id=assembly.id,
        unit_number="101",
        owner_name="Maria",
        ideal_fraction=2.5,
        cpf_cnpj="123.456.789-09",
    )
    db_session.add(unit)
    db_session.flush()

    agenda = Agenda(
        assembly_id=assembly.id,
        title="Aprovacao",
        description="Teste",
        display_order=1,
        status=agenda_status,
        opened_at=datetime.now(timezone.utc) if agenda_status == AgendaStatus.open else None,
    )
    db_session.add(agenda)
    db_session.flush()

    option_yes = AgendaOption(agenda_id=agenda.id, option_text="Sim", display_order=1)
    db_session.add(option_yes)
    db_session.flush()

    qr_code = QRCode(tenant_id=tenant_id, visual_number=1, token=uuid4(), status=qr_status)
    db_session.add(qr_code)
    db_session.flush()

    if with_assignment:
        assignment = QRCodeAssignment(
            assembly_id=assembly.id,
            qr_code_id=qr_code.id,
            is_proxy=False,
            assigned_by=user.id,
        )
        db_session.add(assignment)
        db_session.flush()
        db_session.add(QRCodeAssignedUnit(assignment_id=assignment.id, assembly_unit_id=unit.id))

    db_session.commit()

    return {
        "qr_token": str(qr_code.token),
        "agenda_id": agenda.id,
        "option_id": option_yes.id,
    }


def test_voting_status_returns_open_agenda(client: TestClient, db_session: Session) -> None:
    context = _seed_context(db_session)

    response = client.get(f"/api/v1/voting/status/{context['qr_token']}")

    assert response.status_code == 200
    payload = response.json()
    assert payload["agenda"] is not None
    assert payload["agenda"]["status"] == "open"
    assert payload["has_voted"] is False
    assert len(payload["units"]) == 1


def test_voting_status_returns_agenda_null_when_no_open_agenda(client: TestClient, db_session: Session) -> None:
    context = _seed_context(db_session, agenda_status=AgendaStatus.pending)

    response = client.get(f"/api/v1/voting/status/{context['qr_token']}")

    assert response.status_code == 200
    payload = response.json()
    assert payload["agenda"] is None
    assert payload["has_voted"] is False


def test_voting_status_returns_error_when_qr_not_assigned(client: TestClient, db_session: Session) -> None:
    context = _seed_context(db_session, with_assignment=False)

    response = client.get(f"/api/v1/voting/status/{context['qr_token']}")

    assert response.status_code == 400
    assert "Aguardando check-in" in response.json()["detail"]


def test_voting_status_returns_error_for_inactive_qr(client: TestClient, db_session: Session) -> None:
    context = _seed_context(db_session, qr_status=QRCodeStatus.inactive)

    response = client.get(f"/api/v1/voting/status/{context['qr_token']}")

    assert response.status_code == 400
    assert "desativado" in response.json()["detail"]


def test_voting_status_returns_error_for_invalid_qr(client: TestClient) -> None:
    response = client.get(f"/api/v1/voting/status/{uuid4()}")

    assert response.status_code == 404
    assert "invalido" in response.json()["detail"].lower()


def test_cast_vote_works_without_authentication(client: TestClient, db_session: Session) -> None:
    context = _seed_context(db_session)

    vote_response = client.post(
        "/api/v1/voting/vote",
        json={
            "qr_token": context["qr_token"],
            "agenda_id": context["agenda_id"],
            "option_id": context["option_id"],
        },
    )
    assert vote_response.status_code == 201

    status_response = client.get(f"/api/v1/voting/status/{context['qr_token']}")
    assert status_response.status_code == 200
    assert status_response.json()["has_voted"] is True
