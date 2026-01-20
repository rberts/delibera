"""SQLAlchemy models for agendas and agenda options."""
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
    func,
)

from app.core.database import Base
from app.core.enums import AgendaStatus


class Agenda(Base):
    __tablename__ = "agendas"
    __table_args__ = (
        UniqueConstraint("assembly_id", "display_order", name="chk_agenda_order"),
        CheckConstraint(
            "(status = 'open' AND opened_at IS NOT NULL) OR "
            "(status != 'open' AND (closed_at IS NULL OR closed_at >= opened_at))",
            name="chk_agenda_dates",
        ),
        Index("idx_agendas_assembly", "assembly_id"),
        Index("idx_agendas_status", "status"),
        Index("idx_agendas_order", "assembly_id", "display_order"),
    )

    id = Column(Integer, primary_key=True)
    assembly_id = Column(Integer, ForeignKey("assemblies.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    display_order = Column(Integer, nullable=False, server_default="0")
    status = Column(Enum(AgendaStatus, name="agenda_status"), nullable=False, server_default=AgendaStatus.pending.value)
    opened_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class AgendaOption(Base):
    __tablename__ = "agenda_options"
    __table_args__ = (
        UniqueConstraint("agenda_id", "display_order", name="uq_agenda_option_order"),
        Index("idx_agenda_options_agenda", "agenda_id"),
        Index("idx_agenda_options_order", "agenda_id", "display_order"),
    )

    id = Column(Integer, primary_key=True)
    agenda_id = Column(Integer, ForeignKey("agendas.id", ondelete="CASCADE"), nullable=False)
    option_text = Column(String(255), nullable=False)
    display_order = Column(Integer, nullable=False, server_default="0")
    created_at = Column(DateTime, server_default=func.now())
