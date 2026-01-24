"""SQLAlchemy models for QR codes."""
from uuid import uuid4

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Index, Integer, UniqueConstraint, text, func
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base
from app.core.enums import QRCodeStatus


class QRCode(Base):
    __tablename__ = "qr_codes"
    __table_args__ = (
        UniqueConstraint("tenant_id", "visual_number", name="uq_tenant_visual_number"),
        Index("idx_qr_codes_token", "token", unique=True),
        Index("idx_qr_codes_tenant", "tenant_id"),
        Index("idx_qr_codes_visual", "tenant_id", "visual_number"),
        Index(
            "idx_qr_codes_active",
            "tenant_id",
            postgresql_where=text("deleted_at IS NULL"),
        ),
    )

    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    token = Column(
        UUID(as_uuid=True),
        nullable=False,
        unique=True,
        default=uuid4,
        server_default=text("gen_random_uuid()"),
    )
    visual_number = Column(Integer, nullable=False)
    status = Column(
        Enum(QRCodeStatus, name="qr_code_status"),
        nullable=False,
        default=QRCodeStatus.active,
        server_default=QRCodeStatus.active.value,
    )
    created_at = Column(DateTime, server_default=func.now())
    deleted_at = Column(DateTime, nullable=True)
