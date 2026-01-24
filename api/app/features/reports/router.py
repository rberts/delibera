"""
Report generation endpoints.
"""
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_tenant
from app.features.reports import generator

router = APIRouter()


@router.get(
    "/assemblies/{assembly_id}/attendance",
    summary="Generate attendance list PDF",
)
async def generate_attendance_report(
    assembly_id: int,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
) -> StreamingResponse:
    """Generate attendance list PDF."""
    pdf_buffer = generator.generate_attendance_pdf(db, assembly_id, tenant_id)
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=lista-presenca-{assembly_id}.pdf",
        },
    )


@router.get(
    "/agendas/{agenda_id}/results",
    summary="Generate agenda results PDF",
)
async def generate_agenda_report(
    agenda_id: int,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
) -> StreamingResponse:
    """Generate agenda results PDF."""
    pdf_buffer = generator.generate_agenda_results_pdf(db, agenda_id, tenant_id)
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=resultado-pauta-{agenda_id}.pdf",
        },
    )


@router.get(
    "/assemblies/{assembly_id}/final",
    summary="Generate final assembly report PDF",
)
async def generate_final_report(
    assembly_id: int,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
) -> StreamingResponse:
    """Generate final assembly report (attendance + all results)."""
    pdf_buffer = generator.generate_final_report_pdf(db, assembly_id, tenant_id)
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=relatorio-final-{assembly_id}.pdf",
        },
    )
