"""SQLAlchemy models for QR code assignments."""
from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, Boolean, UniqueConstraint, func

from app.core.database import Base


class QRCodeAssignment(Base):
    __tablename__ = "qr_code_assignments"
    __table_args__ = (
        UniqueConstraint("assembly_id", "qr_code_id", name="uq_qr_per_assembly"),
        Index("idx_qr_assignments_assembly", "assembly_id"),
        Index("idx_qr_assignments_qr", "qr_code_id"),
        Index("idx_qr_assignments_assigned_by", "assigned_by"),
    )

    id = Column(Integer, primary_key=True)
    assembly_id = Column(Integer, ForeignKey("assemblies.id", ondelete="CASCADE"), nullable=False)
    qr_code_id = Column(Integer, ForeignKey("qr_codes.id", ondelete="RESTRICT"), nullable=False)
    is_proxy = Column(Boolean, nullable=False, server_default="false")
    assigned_at = Column(DateTime, server_default=func.now())
    assigned_by = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)


class QRCodeAssignedUnit(Base):
    __tablename__ = "qr_code_assigned_units"
    __table_args__ = (
        UniqueConstraint("assignment_id", "assembly_unit_id", name="uq_assignment_unit"),
        Index("idx_qr_assigned_units_assignment", "assignment_id"),
        Index("idx_qr_assigned_units_unit", "assembly_unit_id"),
    )

    id = Column(Integer, primary_key=True)
    assignment_id = Column(Integer, ForeignKey("qr_code_assignments.id", ondelete="CASCADE"), nullable=False)
    assembly_unit_id = Column(Integer, ForeignKey("assembly_units.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
