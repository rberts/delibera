"""End-to-end tests for the assembly flow."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.features.users.models import User


def _csv_payload() -> bytes:
    return (
        "unit_number,owner_name,ideal_fraction,cpf_cnpj\n"
        "101,Joao Silva,2.5,123.456.789-09\n"
        "102,Maria Souza,2.5,12.345.678/0001-95\n"
        "201,Carlos Lima,3.0,987.654.321-00\n"
    ).encode("utf-8")


def test_complete_assembly_flow(
    authenticated_client: TestClient,
    sample_user: User,
) -> None:
    """Create assembly, import units, check-in, vote, and fetch results."""
    client = authenticated_client

    condo_response = client.post(
        "/api/v1/condominiums",
        json={"name": "Condominio Alfa", "address": "Rua A, 123"},
    )
    assert condo_response.status_code == 201
    condominium_id = condo_response.json()["id"]

    assembly_date = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    assembly_response = client.post(
        "/api/v1/assemblies",
        json={
            "condominium_id": condominium_id,
            "operator_id": sample_user.id,
            "title": "Assembleia Ordinaria",
            "assembly_date": assembly_date,
            "location": "Salao de festas",
            "assembly_type": "ordinary",
        },
    )
    assert assembly_response.status_code == 201
    assembly_id = assembly_response.json()["id"]

    preview_response = client.post(
        f"/api/v1/assemblies/{assembly_id}/units/preview",
        files={"file": ("units.csv", _csv_payload(), "text/csv")},
    )
    assert preview_response.status_code == 200
    assert preview_response.json()["can_import"] is True

    import_response = client.post(
        f"/api/v1/assemblies/{assembly_id}/units/import",
        files={"file": ("units.csv", _csv_payload(), "text/csv")},
    )
    assert import_response.status_code == 200
    assert import_response.json()["total_imported"] == 3

    qr_response = client.post("/api/v1/qr-codes", json={"visual_number": 1})
    assert qr_response.status_code == 201
    qr_token = qr_response.json()["token"]

    select_response = client.post(
        f"/api/v1/checkin/assemblies/{assembly_id}/select-units-by-owner",
        json={"owner_name": "Joao Silva"},
    )
    assert select_response.status_code == 200
    unit_ids = select_response.json()
    assert unit_ids

    checkin_response = client.post(
        f"/api/v1/checkin/assemblies/{assembly_id}/checkin",
        json={"qr_token": qr_token, "unit_ids": unit_ids, "is_proxy": False},
    )
    assert checkin_response.status_code == 201

    agenda_response = client.post(
        "/api/v1/agendas",
        json={
            "assembly_id": assembly_id,
            "title": "Aprovacao de contas",
            "description": "Ano 2025",
            "display_order": 1,
            "options": [
                {"option_text": "Sim", "display_order": 1},
                {"option_text": "Nao", "display_order": 2},
            ],
        },
    )
    assert agenda_response.status_code == 201
    agenda_id = agenda_response.json()["id"]
    option_yes = next(option for option in agenda_response.json()["options"] if option["option_text"] == "Sim")

    open_response = client.put(
        f"/api/v1/agendas/{agenda_id}",
        json={"status": "open"},
    )
    assert open_response.status_code == 200

    vote_response = client.post(
        "/api/v1/voting/vote",
        json={"qr_token": qr_token, "agenda_id": agenda_id, "option_id": option_yes["id"]},
    )
    assert vote_response.status_code == 201
    assert vote_response.json()["votes_created"] >= 1

    results_response = client.get(f"/api/v1/voting/agendas/{agenda_id}/results")
    assert results_response.status_code == 200
    results_data = results_response.json()
    assert results_data["total_units_voted"] >= 1

    quorum_response = client.get(f"/api/v1/voting/assemblies/{assembly_id}/quorum")
    assert quorum_response.status_code == 200
    quorum_data = quorum_response.json()
    assert quorum_data["total_units"] >= 1
    assert quorum_data["units_present"] >= 1
