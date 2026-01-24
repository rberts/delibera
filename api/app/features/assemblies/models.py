"""SQLAlchemy models for assemblies and assembly units."""
from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    Numeric,
    text,
    func,
)

from app.core.database import Base
from app.core.enums import AssemblyStatus, AssemblyType


class Assembly(Base):
    __tablename__ = "assemblies"
    __table_args__ = (
        CheckConstraint("assembly_date >= created_at", name="chk_assembly_date"),
        Index("idx_assemblies_condominium", "condominium_id"),
        Index("idx_assemblies_operator", "operator_id"),
        Index("idx_assemblies_date", text("assembly_date DESC")),
        Index("idx_assemblies_status", "status"),
        Index("idx_assemblies_condo_date", "condominium_id", text("assembly_date DESC")),
    )

    id = Column(Integer, primary_key=True)
    condominium_id = Column(Integer, ForeignKey("condominiums.id", ondelete="RESTRICT"), nullable=False)
    operator_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    assembly_date = Column(DateTime, nullable=False)
    location = Column(Text, nullable=False)
    assembly_type = Column(Enum(AssemblyType, name="assembly_type"), nullable=False)
    status = Column(Enum(AssemblyStatus, name="assembly_status"), nullable=False, server_default=AssemblyStatus.draft.value)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class AssemblyUnit(Base):
    __tablename__ = "assembly_units"
    __table_args__ = (
        CheckConstraint("ideal_fraction > 0 AND ideal_fraction <= 100", name="chk_unit_ideal_fraction"),
        UniqueConstraint("assembly_id", "unit_number", name="uq_assembly_unit_number"),
        Index("idx_assembly_units_assembly", "assembly_id"),
        Index("idx_assembly_units_owner", "owner_name"),
    )

    id = Column(Integer, primary_key=True)
    assembly_id = Column(Integer, ForeignKey("assemblies.id", ondelete="CASCADE"), nullable=False)
    unit_number = Column(String(50), nullable=False)
    owner_name = Column(String(255), nullable=False)
    ideal_fraction = Column(Numeric(5, 2), nullable=False)
    cpf_cnpj = Column(String(18), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
