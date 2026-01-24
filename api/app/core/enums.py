"""Enum definitions used by SQLAlchemy models."""
from enum import Enum


class AssemblyType(str, Enum):
    ordinary = "ordinary"
    extraordinary = "extraordinary"


class AssemblyStatus(str, Enum):
    draft = "draft"
    in_progress = "in_progress"
    finished = "finished"
    cancelled = "cancelled"


class AgendaStatus(str, Enum):
    pending = "pending"
    open = "open"
    closed = "closed"
    cancelled = "cancelled"


class UserRole(str, Enum):
    property_manager = "property_manager"
    assembly_operator = "assembly_operator"


class UserStatus(str, Enum):
    active = "active"
    inactive = "inactive"


class CondominiumStatus(str, Enum):
    active = "active"
    inactive = "inactive"


class QRCodeStatus(str, Enum):
    active = "active"
    inactive = "inactive"
