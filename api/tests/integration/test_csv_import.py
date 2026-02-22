"""Integration tests for CSV preview/import endpoints."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.features.users.models import User


def _build_csv(rows: list[tuple[str, str, str, str]]) -> bytes:
    header = "unit_number,owner_name,ideal_fraction,cpf_cnpj\n"
    body = "\n".join(",".join(row) for row in rows)
    return f"{header}{body}\n".encode("utf-8")


def _create_assembly(client: TestClient, sample_user: User) -> int:
    condo_response = client.post(
        "/api/v1/condominiums",
        json={"name": "Condominio CSV", "address": "Rua B, 456"},
    )
    assert condo_response.status_code == 201
    condominium_id = condo_response.json()["id"]

    assembly_date = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    assembly_response = client.post(
        "/api/v1/assemblies",
        json={
            "condominium_id": condominium_id,
            "operator_id": sample_user.id,
            "title": "Assembleia CSV",
            "assembly_date": assembly_date,
            "location": "Salao principal",
            "assembly_type": "ordinary",
        },
    )
    assert assembly_response.status_code == 201
    return assembly_response.json()["id"]


def test_preview_validates_rows_beyond_first_ten(
    authenticated_client: TestClient,
    sample_user: User,
) -> None:
    assembly_id = _create_assembly(authenticated_client, sample_user)
    rows = [
        ("101", "Joao Silva", "9.0", "123.456.789-09"),
        ("102", "Maria Souza", "9.0", "12.345.678/0001-95"),
        ("103", "Carlos Lima", "9.0", "123.456.789-09"),
        ("104", "Ana Costa", "9.0", "12.345.678/0001-95"),
        ("105", "Paula Mendes", "9.0", "123.456.789-09"),
        ("106", "Rita Alves", "9.0", "12.345.678/0001-95"),
        ("107", "Joana Melo", "9.0", "123.456.789-09"),
        ("108", "Renata Cruz", "9.0", "12.345.678/0001-95"),
        ("109", "Bruno Rocha", "9.0", "123.456.789-09"),
        ("110", "Igor Dias", "9.0", "12.345.678/0001-95"),
        ("111", "Lara Pinto", "9.0", "123.456.789-09"),
        ("101", "Duplicado", "1.0", "12.345.678/0001-95"),
    ]
    payload = _build_csv(rows)

    preview_response = authenticated_client.post(
        f"/api/v1/assemblies/{assembly_id}/units/preview",
        files={"file": ("units.csv", payload, "text/csv")},
    )

    assert preview_response.status_code == 200
    data = preview_response.json()
    assert data["total_rows"] == 12
    assert len(data["preview"]) == 10
    assert data["can_import"] is False
    assert any(error["line"] == 13 and error["field"] == "unit_number" for error in data["errors"])


def test_preview_warns_fraction_sum_with_full_file(
    authenticated_client: TestClient,
    sample_user: User,
) -> None:
    assembly_id = _create_assembly(authenticated_client, sample_user)
    rows = [
        ("201", "Joao Silva", "3.0", "123.456.789-09"),
        ("202", "Maria Souza", "3.0", "12.345.678/0001-95"),
        ("203", "Carlos Lima", "3.0", "123.456.789-09"),
        ("204", "Ana Costa", "3.0", "12.345.678/0001-95"),
        ("205", "Paula Mendes", "3.0", "123.456.789-09"),
        ("206", "Rita Alves", "3.0", "12.345.678/0001-95"),
        ("207", "Joana Melo", "3.0", "123.456.789-09"),
        ("208", "Renata Cruz", "3.0", "12.345.678/0001-95"),
        ("209", "Bruno Rocha", "3.0", "123.456.789-09"),
        ("210", "Igor Dias", "3.0", "12.345.678/0001-95"),
        ("211", "Lara Pinto", "3.0", "123.456.789-09"),
        ("212", "Nina Reis", "3.0", "12.345.678/0001-95"),
    ]
    payload = _build_csv(rows)

    preview_response = authenticated_client.post(
        f"/api/v1/assemblies/{assembly_id}/units/preview",
        files={"file": ("units.csv", payload, "text/csv")},
    )

    assert preview_response.status_code == 200
    data = preview_response.json()
    assert data["can_import"] is True
    assert data["warnings"]
    assert "36.00%" in data["warnings"][0]["message"]


def test_import_and_list_units_snapshot(
    authenticated_client: TestClient,
    sample_user: User,
) -> None:
    assembly_id = _create_assembly(authenticated_client, sample_user)
    payload = _build_csv(
        [
            ("301", "Joao Silva", "2.5", "123.456.789-09"),
            ("302", "Maria Souza", "2.5", "12.345.678/0001-95"),
            ("303", "Carlos Lima", "3.0", "987.654.321-00"),
        ]
    )

    import_response = authenticated_client.post(
        f"/api/v1/assemblies/{assembly_id}/units/import",
        files={"file": ("units.csv", payload, "text/csv")},
    )
    assert import_response.status_code == 200
    assert import_response.json()["total_imported"] == 3

    units_response = authenticated_client.get(f"/api/v1/assemblies/{assembly_id}/units")
    assert units_response.status_code == 200
    data = units_response.json()

    assert data["total"] == 3
    assert round(data["fraction_sum"], 2) == 8.0
    assert [item["unit_number"] for item in data["items"]] == ["301", "302", "303"]
