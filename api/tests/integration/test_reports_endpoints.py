"""Integration tests for report endpoints."""
from __future__ import annotations

from io import BytesIO

import pytest
from fastapi.testclient import TestClient


def _dummy_pdf() -> BytesIO:
    return BytesIO(b"%PDF-1.4\n%dummy\n")


@pytest.mark.asyncio
async def test_attendance_report_endpoint(
    authenticated_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        "app.features.reports.router.generator.generate_attendance_pdf",
        lambda *_args, **_kwargs: _dummy_pdf(),
    )

    response = authenticated_client.get("/api/v1/reports/assemblies/1/attendance")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/pdf")
    assert "lista-presenca-1.pdf" in response.headers.get("content-disposition", "")


@pytest.mark.asyncio
async def test_agenda_results_report_endpoint(
    authenticated_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        "app.features.reports.router.generator.generate_agenda_results_pdf",
        lambda *_args, **_kwargs: _dummy_pdf(),
    )

    response = authenticated_client.get("/api/v1/reports/agendas/2/results")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/pdf")
    assert "resultado-pauta-2.pdf" in response.headers.get("content-disposition", "")


@pytest.mark.asyncio
async def test_final_report_endpoint(
    authenticated_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        "app.features.reports.router.generator.generate_final_report_pdf",
        lambda *_args, **_kwargs: _dummy_pdf(),
    )

    response = authenticated_client.get("/api/v1/reports/assemblies/3/final")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/pdf")
    assert "relatorio-final-3.pdf" in response.headers.get("content-disposition", "")
