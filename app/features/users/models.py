"""SQLAlchemy models for users."""
from sqlalchemy import CheckConstraint, Column, DateTime, Enum, ForeignKey, Index, Integer, String, func, text

from app.core.database import Base
from app.core.enums import UserRole


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint(
            "email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'",
            name="chk_user_email",
        ),
        Index("idx_users_tenant", "tenant_id"),
        Index(
            "idx_users_email",
            "email",
            unique=True,
            postgresql_where=text("deleted_at IS NULL"),
        ),
        Index(
            "idx_users_deleted",
            "deleted_at",
            postgresql_where=text("deleted_at IS NOT NULL"),
        ),
    )

    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole, name="user_role"), nullable=False, server_default=UserRole.assembly_operator.value)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime, nullable=True)
