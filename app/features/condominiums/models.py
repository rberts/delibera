"""SQLAlchemy models for condominiums."""
from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, String, Text, func

from app.core.database import Base


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
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
