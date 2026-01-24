"""Business logic for check-in operations."""
from __future__ import annotations

from typing import List
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app.core.enums import QRCodeStatus
from app.core.exceptions import QRCodeAlreadyAssignedError
from app.features.assemblies.models import Assembly, AssemblyUnit
from app.features.checkin.models import QRCodeAssignment, QRCodeAssignedUnit
from app.features.condominiums.models import Condominium
from app.features.qr_codes.models import QRCode
from app.features.voting.models import Vote


def _get_assembly(db: Session, assembly_id: int, tenant_id: int) -> Assembly:
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
    return assembly


def _get_qr_code(db: Session, qr_token: UUID, tenant_id: int) -> QRCode:
    qr_code = (
        db.query(QRCode)
        .filter(
            QRCode.token == qr_token,
            QRCode.tenant_id == tenant_id,
            QRCode.deleted_at.is_(None),
            QRCode.status == QRCodeStatus.active,
        )
        .first()
    )
    if not qr_code:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="QR code not found")
    return qr_code


def _get_units(db: Session, assembly_id: int, unit_ids: List[int]) -> List[AssemblyUnit]:
    units = (
        db.query(AssemblyUnit)
        .filter(
            AssemblyUnit.assembly_id == assembly_id,
            AssemblyUnit.id.in_(unit_ids),
        )
        .all()
    )
    if len(units) != len(unit_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more units not found for this assembly",
        )
    return units


def assign_qr_code(
    db: Session,
    assembly_id: int,
    qr_token: UUID,
    unit_ids: List[int],
    is_proxy: bool,
    assigned_by: int,
    tenant_id: int,
) -> QRCodeAssignment:
    """Assign QR code to units (check-in)."""
    _get_assembly(db, assembly_id, tenant_id)
    qr_code = _get_qr_code(db, qr_token, tenant_id)

    existing_assignment = (
        db.query(QRCodeAssignment)
        .filter(
            QRCodeAssignment.assembly_id == assembly_id,
            QRCodeAssignment.qr_code_id == qr_code.id,
        )
        .first()
    )
    if existing_assignment:
        raise QRCodeAlreadyAssignedError()

    _get_units(db, assembly_id, unit_ids)

    assigned_unit_ids = (
        db.query(QRCodeAssignedUnit.assembly_unit_id)
        .join(QRCodeAssignment, QRCodeAssignedUnit.assignment_id == QRCodeAssignment.id)
        .filter(
            QRCodeAssignment.assembly_id == assembly_id,
            QRCodeAssignedUnit.assembly_unit_id.in_(unit_ids),
        )
        .all()
    )
    if assigned_unit_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more units are already checked in",
        )

    assignment = QRCodeAssignment(
        assembly_id=assembly_id,
        qr_code_id=qr_code.id,
        is_proxy=is_proxy,
        assigned_by=assigned_by,
    )
    db.add(assignment)
    db.flush()

    links = [
        QRCodeAssignedUnit(assignment_id=assignment.id, assembly_unit_id=unit_id)
        for unit_id in unit_ids
    ]
    db.add_all(links)
    db.commit()
    db.refresh(assignment)
    return assignment


def unassign_qr_code(db: Session, assignment_id: int, tenant_id: int) -> int:
    """Undo check-in (remove QR assignment)."""
    assignment = (
        db.query(QRCodeAssignment)
        .join(Assembly, QRCodeAssignment.assembly_id == Assembly.id)
        .join(Condominium, Assembly.condominium_id == Condominium.id)
        .filter(
            QRCodeAssignment.id == assignment_id,
            Condominium.tenant_id == tenant_id,
        )
        .first()
    )
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    assembly_id = assignment.assembly_id
    assigned_units = (
        db.query(QRCodeAssignedUnit.assembly_unit_id)
        .filter(QRCodeAssignedUnit.assignment_id == assignment_id)
        .all()
    )
    unit_ids = [row[0] for row in assigned_units]
    if unit_ids:
        votes_exist = (
            db.query(Vote)
            .filter(Vote.assembly_unit_id.in_(unit_ids))
            .first()
        )
        if votes_exist:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot undo check-in because votes already exist",
            )

    db.delete(assignment)
    db.commit()
    return assembly_id


def get_attendance_list(db: Session, assembly_id: int, tenant_id: int) -> list[dict]:
    """Get attendance list for an assembly."""
    _get_assembly(db, assembly_id, tenant_id)

    rows = (
        db.query(
            QRCodeAssignment.id,
            QRCodeAssignment.is_proxy,
            QRCode.visual_number,
            AssemblyUnit.id,
            AssemblyUnit.unit_number,
            AssemblyUnit.owner_name,
            AssemblyUnit.ideal_fraction,
            AssemblyUnit.cpf_cnpj,
        )
        .join(QRCode, QRCodeAssignment.qr_code_id == QRCode.id)
        .join(QRCodeAssignedUnit, QRCodeAssignedUnit.assignment_id == QRCodeAssignment.id)
        .join(AssemblyUnit, AssemblyUnit.id == QRCodeAssignedUnit.assembly_unit_id)
        .filter(QRCodeAssignment.assembly_id == assembly_id)
        .order_by(QRCodeAssignment.id, AssemblyUnit.unit_number.asc())
        .all()
    )

    items: dict[int, dict] = {}
    for (
        assignment_id,
        is_proxy,
        qr_visual_number,
        unit_id,
        unit_number,
        owner_name,
        ideal_fraction,
        cpf_cnpj,
    ) in rows:
        item = items.setdefault(
            assignment_id,
            {
                "assignment_id": assignment_id,
                "qr_visual_number": qr_visual_number,
                "is_proxy": is_proxy,
                "units": [],
                "owner_names": [],
                "total_fraction": 0.0,
            },
        )
        item["units"].append(
            {
                "id": unit_id,
                "unit_number": unit_number,
                "owner_name": owner_name,
                "ideal_fraction": float(ideal_fraction),
                "cpf_cnpj": cpf_cnpj,
            }
        )
        item["owner_names"].append(owner_name)
        item["total_fraction"] += float(ideal_fraction)

    return list(items.values())


def get_attendance_summary(db: Session, assembly_id: int, tenant_id: int) -> tuple[int, float]:
    """Return units present and fraction present for SSE updates."""
    _get_assembly(db, assembly_id, tenant_id)

    present_unit_ids = (
        db.query(QRCodeAssignedUnit.assembly_unit_id)
        .join(QRCodeAssignment, QRCodeAssignedUnit.assignment_id == QRCodeAssignment.id)
        .filter(QRCodeAssignment.assembly_id == assembly_id)
        .distinct()
        .subquery()
    )

    units_present = db.query(func.count()).select_from(present_unit_ids).scalar() or 0
    fraction_present = (
        db.query(func.coalesce(func.sum(AssemblyUnit.ideal_fraction), 0.0))
        .filter(AssemblyUnit.id.in_(present_unit_ids))
        .scalar()
        or 0.0
    )
    return units_present, float(fraction_present)


def select_units_by_owner(
    db: Session,
    assembly_id: int,
    owner_name: str,
    tenant_id: int,
    cpf_cnpj: str | None = None,
) -> list[int]:
    """Select all unit IDs for a given owner in an assembly."""
    _get_assembly(db, assembly_id, tenant_id)

    owner_name = owner_name.strip()
    query = db.query(AssemblyUnit.id).filter(
        AssemblyUnit.assembly_id == assembly_id,
        func.lower(func.trim(AssemblyUnit.owner_name)) == owner_name.lower(),
    )
    if cpf_cnpj:
        query = query.filter(AssemblyUnit.cpf_cnpj == cpf_cnpj)
    return [row[0] for row in query.all()]
