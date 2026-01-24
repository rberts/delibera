"""Unit tests for CSV processor."""
from __future__ import annotations

from io import BytesIO

import pytest
from fastapi import HTTPException
from starlette.datastructures import UploadFile

from app.features.assemblies import csv_processor


def _upload(content: bytes, filename: str = "units.csv") -> UploadFile:
    return UploadFile(filename=filename, file=BytesIO(content))


@pytest.mark.asyncio
async def test_parse_csv_file_requires_csv_extension() -> None:
    with pytest.raises(HTTPException) as exc:
        await csv_processor.parse_csv_file(_upload(b"test", filename="units.txt"))

    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_parse_csv_file_missing_columns() -> None:
    payload = b"unit_number,owner_name\n101,Joao\n"
    with pytest.raises(HTTPException) as exc:
        await csv_processor.parse_csv_file(_upload(payload))

    assert exc.value.status_code == 400


def test_validate_cpf_cnpj_valid_and_invalid() -> None:
    assert csv_processor.validate_cpf_cnpj("123.456.789-09") is True
    assert csv_processor.validate_cpf_cnpj("111.111.111-11") is False
    assert csv_processor.validate_cpf_cnpj("12.345.678/0001-95") is True


@pytest.mark.asyncio
async def test_preview_csv_import_with_invalid_row() -> None:
    payload = (
        b"unit_number,owner_name,ideal_fraction,cpf_cnpj\n"
        b",Joao,2.5,123.456.789-09\n"
    )
    preview = await csv_processor.preview_csv_import(_upload(payload), assembly_id=1)

    assert preview["can_import"] is False
    assert preview["errors"]
