"""Business logic for voting operations."""
from __future__ import annotations

from typing import List
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app.core.enums import AgendaStatus, QRCodeStatus
from app.core.exceptions import AgendaNotOpenError, VoteAlreadyCastError
from app.features.agendas.models import Agenda, AgendaOption
from app.features.assemblies.models import Assembly, AssemblyUnit
from app.features.checkin.models import QRCodeAssignedUnit, QRCodeAssignment
from app.features.condominiums.models import Condominium
from app.features.qr_codes.models import QRCode
from app.features.voting.models import Vote
from app.features.voting.schemas import AgendaResultsResponse, OptionResult, QuorumResponse


def _get_agenda(db: Session, agenda_id: int, tenant_id: int) -> Agenda:
    agenda = (
        db.query(Agenda)
        .join(Assembly, Agenda.assembly_id == Assembly.id)
        .join(Condominium, Assembly.condominium_id == Condominium.id)
        .filter(
            Agenda.id == agenda_id,
            Condominium.tenant_id == tenant_id,
        )
        .first()
    )
    if not agenda:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agenda not found")
    return agenda


def _get_option(db: Session, agenda_id: int, option_id: int) -> AgendaOption:
    option = (
        db.query(AgendaOption)
        .filter(
            AgendaOption.id == option_id,
            AgendaOption.agenda_id == agenda_id,
        )
        .first()
    )
    if not option:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agenda option not found")
    return option


def _get_assignment(
    db: Session,
    qr_token: UUID,
    assembly_id: int,
    tenant_id: int,
) -> QRCodeAssignment:
    assignment = (
        db.query(QRCodeAssignment)
        .join(QRCode, QRCodeAssignment.qr_code_id == QRCode.id)
        .filter(
            QRCode.token == qr_token,
            QRCode.tenant_id == tenant_id,
            QRCode.deleted_at.is_(None),
            QRCode.status == QRCodeStatus.active,
            QRCodeAssignment.assembly_id == assembly_id,
        )
        .first()
    )
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="QR code not assigned to assembly")
    return assignment


def cast_vote(
    db: Session,
    qr_token: UUID,
    agenda_id: int,
    option_id: int,
    tenant_id: int,
) -> List[int]:
    """Cast a vote for all units linked to a QR code."""
    agenda = _get_agenda(db, agenda_id, tenant_id)
    if agenda.status != AgendaStatus.open:
        raise AgendaNotOpenError(agenda.status.value)

    _get_option(db, agenda_id, option_id)
    assignment = _get_assignment(db, qr_token, agenda.assembly_id, tenant_id)

    unit_ids = [
        row[0]
        for row in db.query(QRCodeAssignedUnit.assembly_unit_id)
        .filter(QRCodeAssignedUnit.assignment_id == assignment.id)
        .all()
    ]
    if not unit_ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No units assigned to this QR code")

    existing_vote = (
        db.query(Vote)
        .filter(
            Vote.agenda_id == agenda_id,
            Vote.assembly_unit_id.in_(unit_ids),
        )
        .first()
    )
    if existing_vote:
        raise VoteAlreadyCastError()

    votes = [
        Vote(
            agenda_id=agenda_id,
            assembly_unit_id=unit_id,
            option_id=option_id,
            is_valid=True,
        )
        for unit_id in unit_ids
    ]
    db.add_all(votes)
    db.flush()
    db.commit()
    return [vote.id for vote in votes]


def invalidate_vote(db: Session, vote_id: int, invalidated_by: int, tenant_id: int) -> Vote:
    """Invalidate a vote (audit-friendly)."""
    vote = (
        db.query(Vote)
        .join(Agenda, Vote.agenda_id == Agenda.id)
        .join(Assembly, Agenda.assembly_id == Assembly.id)
        .join(Condominium, Assembly.condominium_id == Condominium.id)
        .filter(
            Vote.id == vote_id,
            Condominium.tenant_id == tenant_id,
        )
        .first()
    )
    if not vote:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vote not found")
    if not vote.is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Vote already invalidated")

    vote.is_valid = False
    vote.invalidated_by = invalidated_by
    vote.invalidated_at = func.now()
    db.commit()
    db.refresh(vote)
    return vote


def calculate_quorum(db: Session, assembly_id: int, tenant_id: int) -> QuorumResponse:
    """Calculate quorum for an assembly based on check-in."""
    assembly = (
        db.query(Assembly)
        .join(Condominium, Assembly.condominium_id == Condominium.id)
        .filter(
            Assembly.id == assembly_id,
            Condominium.tenant_id == tenant_id,
        )
        .first()
    )
    if not assembly:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assembly not found")

    total_units = (
        db.query(func.count(AssemblyUnit.id))
        .filter(AssemblyUnit.assembly_id == assembly_id)
        .scalar()
        or 0
    )

    present_unit_ids = (
        select(QRCodeAssignedUnit.assembly_unit_id)
        .join(QRCodeAssignment, QRCodeAssignedUnit.assignment_id == QRCodeAssignment.id)
        .filter(QRCodeAssignment.assembly_id == assembly_id)
        .distinct()
    )

    present_units_subquery = present_unit_ids.subquery()
    units_present = db.query(func.count()).select_from(present_units_subquery).scalar() or 0
    fraction_present = (
        db.query(func.coalesce(func.sum(AssemblyUnit.ideal_fraction), 0.0))
        .filter(AssemblyUnit.id.in_(present_unit_ids))
        .scalar()
        or 0.0
    )
    fraction_present = float(fraction_present)
    quorum_reached = fraction_present >= 50.0

    return QuorumResponse(
        total_units=total_units,
        units_present=units_present,
        fraction_present=fraction_present,
        quorum_reached=quorum_reached,
    )


def calculate_results(db: Session, agenda_id: int, tenant_id: int) -> AgendaResultsResponse:
    """Calculate voting results for an agenda."""
    agenda = _get_agenda(db, agenda_id, tenant_id)
    assembly_id = agenda.assembly_id

    present_unit_ids = (
        select(QRCodeAssignedUnit.assembly_unit_id)
        .join(QRCodeAssignment, QRCodeAssignedUnit.assignment_id == QRCodeAssignment.id)
        .filter(QRCodeAssignment.assembly_id == assembly_id)
        .distinct()
    )

    present_units_subquery = present_unit_ids.subquery()
    total_units_present = db.query(func.count()).select_from(present_units_subquery).scalar() or 0
    total_fraction_present = (
        db.query(func.coalesce(func.sum(AssemblyUnit.ideal_fraction), 0.0))
        .filter(AssemblyUnit.id.in_(present_unit_ids))
        .scalar()
        or 0.0
    )

    total_units_voted = (
        db.query(func.count(func.distinct(Vote.assembly_unit_id)))
        .filter(
            Vote.agenda_id == agenda_id,
            Vote.is_valid.is_(True),
        )
        .scalar()
        or 0
    )
    total_fraction_voted = (
        db.query(func.coalesce(func.sum(AssemblyUnit.ideal_fraction), 0.0))
        .join(Vote, AssemblyUnit.id == Vote.assembly_unit_id)
        .filter(
            Vote.agenda_id == agenda_id,
            Vote.is_valid.is_(True),
        )
        .scalar()
        or 0.0
    )

    aggregates = {
        row.option_id: {
            "votes_count": row.votes_count or 0,
            "fraction_sum": float(row.fraction_sum or 0.0),
        }
        for row in db.query(
            Vote.option_id.label("option_id"),
            func.count(Vote.id).label("votes_count"),
            func.coalesce(func.sum(AssemblyUnit.ideal_fraction), 0.0).label("fraction_sum"),
        )
        .join(AssemblyUnit, AssemblyUnit.id == Vote.assembly_unit_id)
        .filter(
            Vote.agenda_id == agenda_id,
            Vote.is_valid.is_(True),
        )
        .group_by(Vote.option_id)
        .all()
    }

    options = (
        db.query(AgendaOption)
        .filter(AgendaOption.agenda_id == agenda_id)
        .order_by(AgendaOption.display_order.asc())
        .all()
    )

    results: List[OptionResult] = []
    total_fraction_voted = float(total_fraction_voted)
    for option in options:
        aggregate = aggregates.get(option.id, {"votes_count": 0, "fraction_sum": 0.0})
        fraction_sum = aggregate["fraction_sum"]
        percentage = (fraction_sum / total_fraction_voted * 100.0) if total_fraction_voted else 0.0
        results.append(
            OptionResult(
                option_id=option.id,
                option_text=option.option_text,
                votes_count=aggregate["votes_count"],
                fraction_sum=fraction_sum,
                percentage=percentage,
            )
        )

    return AgendaResultsResponse(
        agenda_id=agenda_id,
        total_units_present=total_units_present,
        total_units_voted=total_units_voted,
        total_fraction_present=float(total_fraction_present),
        total_fraction_voted=total_fraction_voted,
        results=results,
    )
