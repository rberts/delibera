"""SQLAlchemy models for tenants."""
from sqlalchemy import CheckConstraint, Column, DateTime, Index, Integer, String, func, text

from app.core.database import Base


class Tenant(Base):
    __tablename__ = "tenants"
    __table_args__ = (
        CheckConstraint(
            "email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'",
            name="chk_tenant_email",
        ),
        Index("idx_tenants_email", "email", unique=True),
        Index("idx_tenants_created", text("created_at DESC")),
    )

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
