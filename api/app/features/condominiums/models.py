"""SQLAlchemy models for condominiums."""
from sqlalchemy import Column, DateTime, Enum, ForeignKey, Index, Integer, String, Text, func

from app.core.database import Base
from app.core.enums import CondominiumStatus


class Condominium(Base):
    __tablename__ = "condominiums"
    __table_args__ = (
        Index("idx_condominiums_tenant", "tenant_id"),
        Index("idx_condominiums_name", "name"),
    )

    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    address = Column(Text, nullable=False)
    status = Column(
        Enum(CondominiumStatus, name="condominium_status"),
        nullable=False,
        default=CondominiumStatus.active,
        server_default=CondominiumStatus.active.value,
    )
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
