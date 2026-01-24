"""Integration tests for voting service logic."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import uuid4

import pytest
from sqlalchemy.orm import Session

from app.core.enums import AgendaStatus, AssemblyType, UserRole, UserStatus
from app.core.exceptions import AgendaNotOpenError, VoteAlreadyCastError
from app.features.agendas.models import Agenda, AgendaOption
from app.features.assemblies.models import Assembly, AssemblyUnit
from app.features.checkin.models import QRCodeAssignedUnit, QRCodeAssignment
from app.features.condominiums.models import Condominium
from app.features.qr_codes.models import QRCode
from app.features.users.models import User
from app.features.voting import service


def _seed_user(db_session: Session, tenant_id: int) -> User:
    user = User(
        tenant_id=tenant_id,
        name="Operator",
        email=f"operator-{tenant_id}@example.com",
        password_hash="hash",
        role=UserRole.assembly_operator,
        status=UserStatus.active,
    )
    db_session.add(user)
    db_session.flush()
    return user


def _setup_voting_context(
    db_session: Session,
    tenant_id: int = 1,
    agenda_status: AgendaStatus = AgendaStatus.open,
) -> dict:
    condominium = Condominium(tenant_id=tenant_id, name="Condo", address="Rua A")
    db_session.add(condominium)
    db_session.flush()

    user = _seed_user(db_session, tenant_id)

    assembly = Assembly(
        condominium_id=condominium.id,
        operator_id=user.id,
        title="Assembleia",
        assembly_date=datetime.now(timezone.utc) + timedelta(days=1),
        location="Salao",
        assembly_type=AssemblyType.ordinary,
    )
    db_session.add(assembly)
    db_session.flush()

    unit = AssemblyUnit(
        assembly_id=assembly.id,
        unit_number="101",
        owner_name="Joao",
        ideal_fraction=2.5,
        cpf_cnpj="123.456.789-09",
    )
    db_session.add(unit)
    db_session.flush()

    agenda = Agenda(
        assembly_id=assembly.id,
        title="Pauta 1",
        description="Teste",
        display_order=1,
        status=agenda_status,
        opened_at=datetime.now(timezone.utc) if agenda_status == AgendaStatus.open else None,
    )
    db_session.add(agenda)
    db_session.flush()

    option = AgendaOption(agenda_id=agenda.id, option_text="Sim", display_order=1)
    db_session.add(option)
    db_session.flush()

    qr = QRCode(tenant_id=tenant_id, visual_number=1, token=uuid4())
    db_session.add(qr)
    db_session.flush()

    assignment = QRCodeAssignment(
        assembly_id=assembly.id,
        qr_code_id=qr.id,
        is_proxy=False,
        assigned_by=user.id,
    )
    db_session.add(assignment)
    db_session.flush()

    assigned_unit = QRCodeAssignedUnit(assignment_id=assignment.id, assembly_unit_id=unit.id)
    db_session.add(assigned_unit)
    db_session.commit()

    return {
        "tenant_id": tenant_id,
        "user_id": user.id,
        "agenda_id": agenda.id,
        "option_id": option.id,
        "qr_token": qr.token,
    }


def test_cast_vote_success(db_session: Session) -> None:
    context = _setup_voting_context(db_session)

    vote_ids = service.cast_vote(
        db_session,
        context["qr_token"],
        context["agenda_id"],
        context["option_id"],
        context["tenant_id"],
    )

    assert len(vote_ids) == 1


def test_cast_vote_requires_open_agenda(db_session: Session) -> None:
    context = _setup_voting_context(db_session, agenda_status=AgendaStatus.pending)

    with pytest.raises(AgendaNotOpenError):
        service.cast_vote(
            db_session,
            context["qr_token"],
            context["agenda_id"],
            context["option_id"],
            context["tenant_id"],
        )


def test_cast_vote_prevents_duplicate(db_session: Session) -> None:
    context = _setup_voting_context(db_session)

    service.cast_vote(
        db_session,
        context["qr_token"],
        context["agenda_id"],
        context["option_id"],
        context["tenant_id"],
    )

    with pytest.raises(VoteAlreadyCastError):
        service.cast_vote(
            db_session,
            context["qr_token"],
            context["agenda_id"],
            context["option_id"],
            context["tenant_id"],
        )


def test_invalidate_vote_marks_invalid(db_session: Session) -> None:
    context = _setup_voting_context(db_session)
    vote_ids = service.cast_vote(
        db_session,
        context["qr_token"],
        context["agenda_id"],
        context["option_id"],
        context["tenant_id"],
    )

    vote = service.invalidate_vote(db_session, vote_ids[0], context["user_id"], context["tenant_id"])

    assert vote.is_valid is False
    assert vote.invalidated_by == context["user_id"]
