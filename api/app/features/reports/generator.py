"""
PDF generation using WeasyPrint and Jinja2 templates.
"""
from __future__ import annotations

from datetime import datetime
from io import BytesIO

from fastapi import HTTPException, status
from jinja2 import Environment, FileSystemLoader
from sqlalchemy.orm import Session
from weasyprint import HTML

from app.core.enums import AssemblyType
from app.features.agendas.models import Agenda
from app.features.assemblies.models import Assembly
from app.features.checkin.service import get_attendance_list
from app.features.condominiums.models import Condominium
from app.features.voting.service import calculate_quorum, calculate_results

template_env = Environment(
    loader=FileSystemLoader("app/features/reports/templates"),
    autoescape=True,
)


def _get_assembly_with_condominium(
    db: Session,
    assembly_id: int,
    tenant_id: int,
) -> tuple[Assembly, Condominium]:
    result = (
        db.query(Assembly, Condominium)
        .join(Condominium, Assembly.condominium_id == Condominium.id)
        .filter(
            Assembly.id == assembly_id,
            Condominium.tenant_id == tenant_id,
        )
        .first()
    )
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assembly not found")
    return result


def _get_agenda_with_assembly(
    db: Session,
    agenda_id: int,
    tenant_id: int,
) -> tuple[Agenda, Assembly, Condominium]:
    result = (
        db.query(Agenda, Assembly, Condominium)
        .join(Assembly, Agenda.assembly_id == Assembly.id)
        .join(Condominium, Assembly.condominium_id == Condominium.id)
        .filter(
            Agenda.id == agenda_id,
            Condominium.tenant_id == tenant_id,
        )
        .first()
    )
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agenda not found")
    return result


def _assembly_type_label(assembly_type: AssemblyType | str) -> str:
    if isinstance(assembly_type, AssemblyType):
        value = assembly_type
    else:
        value = AssemblyType(assembly_type)
    return "Ordinaria" if value == AssemblyType.ordinary else "Extraordinaria"


def generate_attendance_pdf(db: Session, assembly_id: int, tenant_id: int) -> BytesIO:
    """Generate attendance list PDF."""
    assembly, condominium = _get_assembly_with_condominium(db, assembly_id, tenant_id)
    attendance = get_attendance_list(db, assembly_id, tenant_id)
    quorum = calculate_quorum(db, assembly_id, tenant_id)

    context = {
        "condominium_name": condominium.name,
        "assembly_title": assembly.title,
        "assembly_date": assembly.assembly_date.strftime("%d/%m/%Y %H:%M"),
        "assembly_location": assembly.location,
        "assembly_type": _assembly_type_label(assembly.assembly_type),
        "total_units": quorum.total_units,
        "units_present": quorum.units_present,
        "fraction_present": quorum.fraction_present,
        "quorum_reached": quorum.quorum_reached,
        "attendance": attendance,
        "generated_at": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
    }

    template = template_env.get_template("attendance_list.html")
    html_content = template.render(**context)

    pdf_buffer = BytesIO()
    HTML(string=html_content).write_pdf(pdf_buffer)
    pdf_buffer.seek(0)
    return pdf_buffer


def generate_agenda_results_pdf(db: Session, agenda_id: int, tenant_id: int) -> BytesIO:
    """Generate agenda results PDF."""
    agenda, assembly, condominium = _get_agenda_with_assembly(db, agenda_id, tenant_id)
    results = calculate_results(db, agenda_id, tenant_id)

    context = {
        "condominium_name": condominium.name,
        "assembly_title": assembly.title,
        "assembly_date": assembly.assembly_date.strftime("%d/%m/%Y %H:%M"),
        "agenda_title": agenda.title,
        "agenda_description": agenda.description or "",
        "total_units_present": results.total_units_present,
        "total_units_voted": results.total_units_voted,
        "total_fraction_present": results.total_fraction_present,
        "total_fraction_voted": results.total_fraction_voted,
        "results": results.results,
        "generated_at": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
    }

    template = template_env.get_template("agenda_results.html")
    html_content = template.render(**context)

    pdf_buffer = BytesIO()
    HTML(string=html_content).write_pdf(pdf_buffer)
    pdf_buffer.seek(0)
    return pdf_buffer


def generate_final_report_pdf(db: Session, assembly_id: int, tenant_id: int) -> BytesIO:
    """Generate final assembly report (attendance + all agenda results)."""
    assembly, condominium = _get_assembly_with_condominium(db, assembly_id, tenant_id)

    agendas = (
        db.query(Agenda)
        .filter(Agenda.assembly_id == assembly_id)
        .order_by(Agenda.display_order.asc())
        .all()
    )

    agenda_results = []
    for agenda in agendas:
        results = calculate_results(db, agenda.id, tenant_id)
        agenda_results.append(
            {
                "title": agenda.title,
                "description": agenda.description or "",
                "status": agenda.status.value,
                "results": results.results,
                "total_units_voted": results.total_units_voted,
                "total_fraction_voted": results.total_fraction_voted,
            }
        )

    attendance = get_attendance_list(db, assembly_id, tenant_id)
    quorum = calculate_quorum(db, assembly_id, tenant_id)

    context = {
        "condominium_name": condominium.name,
        "condominium_address": condominium.address,
        "assembly_title": assembly.title,
        "assembly_date": assembly.assembly_date.strftime("%d/%m/%Y %H:%M"),
        "assembly_location": assembly.location,
        "assembly_type": _assembly_type_label(assembly.assembly_type),
        "total_units": quorum.total_units,
        "units_present": quorum.units_present,
        "fraction_present": quorum.fraction_present,
        "quorum_reached": quorum.quorum_reached,
        "attendance": attendance,
        "agendas": agenda_results,
        "generated_at": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
    }

    template = template_env.get_template("final_report.html")
    html_content = template.render(**context)

    pdf_buffer = BytesIO()
    HTML(string=html_content).write_pdf(pdf_buffer)
    pdf_buffer.seek(0)
    return pdf_buffer
