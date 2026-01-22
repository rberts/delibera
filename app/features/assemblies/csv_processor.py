"""
CSV processing for assembly units import.
Validates data before creating immutable unit snapshots.
"""
from __future__ import annotations

import csv
import re
from decimal import Decimal, InvalidOperation
from io import StringIO
from typing import Any, Dict, List

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.features.assemblies.models import AssemblyUnit


class CSVValidationError(Exception):
    """Custom exception for CSV validation errors."""

    def __init__(self, line_number: int, field: str, message: str) -> None:
        self.line_number = line_number
        self.field = field
        self.message = message
        super().__init__(f"Line {line_number}, field '{field}': {message}")


def _strip_digits(value: str) -> str:
    return re.sub(r"\D", "", value)


def validate_cpf(cpf: str) -> bool:
    """Validate CPF format (Brazilian individual tax ID)."""
    cpf_digits = _strip_digits(cpf)
    if len(cpf_digits) != 11 or cpf_digits == cpf_digits[0] * 11:
        return False

    sum1 = sum(int(cpf_digits[i]) * (10 - i) for i in range(9))
    digit1 = 11 - (sum1 % 11)
    digit1 = 0 if digit1 >= 10 else digit1
    if int(cpf_digits[9]) != digit1:
        return False

    sum2 = sum(int(cpf_digits[i]) * (11 - i) for i in range(10))
    digit2 = 11 - (sum2 % 11)
    digit2 = 0 if digit2 >= 10 else digit2
    if int(cpf_digits[10]) != digit2:
        return False

    return True


def validate_cnpj(cnpj: str) -> bool:
    """Validate CNPJ format (Brazilian company tax ID)."""
    cnpj_digits = _strip_digits(cnpj)
    if len(cnpj_digits) != 14 or cnpj_digits == cnpj_digits[0] * 14:
        return False

    weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    sum1 = sum(int(cnpj_digits[i]) * weights1[i] for i in range(12))
    digit1 = 11 - (sum1 % 11)
    digit1 = 0 if digit1 >= 10 else digit1
    if int(cnpj_digits[12]) != digit1:
        return False

    weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    sum2 = sum(int(cnpj_digits[i]) * weights2[i] for i in range(13))
    digit2 = 11 - (sum2 % 11)
    digit2 = 0 if digit2 >= 10 else digit2
    if int(cnpj_digits[13]) != digit2:
        return False

    return True


def validate_cpf_cnpj(value: str) -> bool:
    """Validate CPF or CNPJ."""
    clean = _strip_digits(value)
    if len(clean) == 11:
        return validate_cpf(value)
    if len(clean) == 14:
        return validate_cnpj(value)
    return False


async def parse_csv_file(file: UploadFile) -> List[Dict[str, str]]:
    """Parse uploaded CSV file and validate required columns."""
    filename = file.filename or ""
    if not filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be CSV format",
        )

    content = await file.read()

    try:
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError:
            text = content.decode("latin-1")

        csv_reader = csv.DictReader(StringIO(text))
        rows = list(csv_reader)
        required_columns = ["unit_number", "owner_name", "ideal_fraction", "cpf_cnpj"]

        if not csv_reader.fieldnames:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CSV file is empty or has no header row",
            )

        missing_columns = set(required_columns) - set(csv_reader.fieldnames)
        if missing_columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required columns: {', '.join(sorted(missing_columns))}",
            )

        return rows
    except csv.Error as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid CSV format: {exc}",
        ) from exc


def validate_csv_row(row: Dict[str, str], line_number: int) -> Dict[str, Any]:
    """Validate a single CSV row."""
    validated: Dict[str, Any] = {}

    unit_number = (row.get("unit_number") or "").strip()
    if not unit_number:
        raise CSVValidationError(line_number, "unit_number", "Cannot be empty")
    validated["unit_number"] = unit_number

    owner_name = (row.get("owner_name") or "").strip()
    if not owner_name:
        raise CSVValidationError(line_number, "owner_name", "Cannot be empty")
    validated["owner_name"] = owner_name

    ideal_fraction_str = (row.get("ideal_fraction") or "").strip()
    if not ideal_fraction_str:
        raise CSVValidationError(line_number, "ideal_fraction", "Cannot be empty")

    try:
        ideal_fraction = Decimal(ideal_fraction_str.replace(",", "."))
    except (InvalidOperation, ValueError) as exc:
        raise CSVValidationError(line_number, "ideal_fraction", "Must be a valid number") from exc

    if ideal_fraction <= 0:
        raise CSVValidationError(line_number, "ideal_fraction", "Must be greater than 0")
    if ideal_fraction > 100:
        raise CSVValidationError(line_number, "ideal_fraction", "Cannot exceed 100%")

    validated["ideal_fraction"] = float(ideal_fraction)

    cpf_cnpj = (row.get("cpf_cnpj") or "").strip()
    if not cpf_cnpj:
        raise CSVValidationError(line_number, "cpf_cnpj", "Cannot be empty")
    if not validate_cpf_cnpj(cpf_cnpj):
        raise CSVValidationError(line_number, "cpf_cnpj", "Invalid CPF or CNPJ format")
    validated["cpf_cnpj"] = cpf_cnpj

    return validated


async def preview_csv_import(file: UploadFile, assembly_id: int) -> Dict[str, Any]:
    """Preview CSV import (first 10 lines + validation errors)."""
    rows = await parse_csv_file(file)

    preview_data = []
    errors = []
    unit_numbers_seen = set()
    total_fraction = 0.0

    for idx, row in enumerate(rows[:10], start=2):
        try:
            validated = validate_csv_row(row, idx)
            if validated["unit_number"] in unit_numbers_seen:
                errors.append(
                    {
                        "line": idx,
                        "field": "unit_number",
                        "message": f"Duplicate unit number: {validated['unit_number']}",
                    }
                )
            else:
                unit_numbers_seen.add(validated["unit_number"])

            total_fraction += validated["ideal_fraction"]

            preview_data.append(
                {
                    "line": idx,
                    "unit_number": validated["unit_number"],
                    "owner_name": validated["owner_name"],
                    "ideal_fraction": validated["ideal_fraction"],
                    "cpf_cnpj": validated["cpf_cnpj"],
                }
            )
        except CSVValidationError as exc:
            errors.append(
                {
                    "line": exc.line_number,
                    "field": exc.field,
                    "message": exc.message,
                }
            )
            preview_data.append(
                {
                    "line": idx,
                    "unit_number": row.get("unit_number", ""),
                    "owner_name": row.get("owner_name", ""),
                    "ideal_fraction": row.get("ideal_fraction", ""),
                    "cpf_cnpj": row.get("cpf_cnpj", ""),
                    "error": True,
                }
            )

    warnings = []
    if abs(total_fraction - 100.0) > 0.1:
        warnings.append(
            {
                "type": "fraction_sum",
                "message": f"Sum of ideal fractions: {total_fraction:.2f}% (expected: 100%)",
            }
        )

    return {
        "preview": preview_data,
        "total_rows": len(rows),
        "errors": errors,
        "warnings": warnings,
        "can_import": len(errors) == 0,
    }


async def import_csv_units(db: Session, file: UploadFile, assembly_id: int) -> List[AssemblyUnit]:
    """Import units from CSV file and create snapshots."""
    rows = await parse_csv_file(file)

    validated_rows = []
    unit_numbers_seen = set()

    for idx, row in enumerate(rows, start=2):
        try:
            validated = validate_csv_row(row, idx)
        except CSVValidationError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(exc),
            ) from exc

        if validated["unit_number"] in unit_numbers_seen:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Line {idx}: Duplicate unit number '{validated['unit_number']}'",
            )

        unit_numbers_seen.add(validated["unit_number"])
        validated_rows.append(validated)

    existing_units = (
        db.query(AssemblyUnit).filter(AssemblyUnit.assembly_id == assembly_id).first()
    )
    if existing_units:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assembly already has units imported",
        )

    units = [
        AssemblyUnit(
            assembly_id=assembly_id,
            unit_number=row["unit_number"],
            owner_name=row["owner_name"],
            ideal_fraction=row["ideal_fraction"],
            cpf_cnpj=row["cpf_cnpj"],
        )
        for row in validated_rows
    ]

    db.bulk_save_objects(units)
    db.commit()

    return (
        db.query(AssemblyUnit)
        .filter(AssemblyUnit.assembly_id == assembly_id)
        .all()
    )
