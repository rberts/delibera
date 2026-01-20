"""set condominium status default

Revision ID: 4b2c1b1a7c2d
Revises: 7f4d1c6b9e0a
Create Date: 2026-01-20 16:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "4b2c1b1a7c2d"
down_revision: Union[str, Sequence[str], None] = "7f4d1c6b9e0a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("UPDATE condominiums SET status = 'active' WHERE status IS NULL")
    op.alter_column(
        "condominiums",
        "status",
        server_default="active",
        existing_type=sa.Enum("active", "inactive", name="condominium_status"),
        nullable=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column(
        "condominiums",
        "status",
        server_default=None,
        existing_type=sa.Enum("active", "inactive", name="condominium_status"),
        nullable=False,
    )
