"""SQLAlchemy models for votes."""
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    UniqueConstraint,
    func,
    text,
)

from app.core.database import Base


class Vote(Base):
    __tablename__ = "votes"
    __table_args__ = (
        UniqueConstraint("agenda_id", "assembly_unit_id", name="uq_vote_per_unit_agenda"),
        CheckConstraint(
            "(is_valid = TRUE AND invalidated_at IS NULL AND invalidated_by IS NULL) OR "
            "(is_valid = FALSE AND invalidated_at IS NOT NULL AND invalidated_by IS NOT NULL)",
            name="chk_invalidation",
        ),
        Index("idx_votes_agenda", "agenda_id"),
        Index("idx_votes_unit", "assembly_unit_id"),
        Index("idx_votes_option", "option_id"),
        Index(
            "idx_votes_valid",
            "agenda_id",
            "is_valid",
            postgresql_where=text("is_valid = TRUE"),
        ),
    )

    id = Column(Integer, primary_key=True)
    agenda_id = Column(Integer, ForeignKey("agendas.id", ondelete="RESTRICT"), nullable=False)
    assembly_unit_id = Column(Integer, ForeignKey("assembly_units.id", ondelete="RESTRICT"), nullable=False)
    option_id = Column(Integer, ForeignKey("agenda_options.id", ondelete="RESTRICT"), nullable=False)
    is_valid = Column(Boolean, nullable=False, server_default="true")
    invalidated_at = Column(DateTime, nullable=True)
    invalidated_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
