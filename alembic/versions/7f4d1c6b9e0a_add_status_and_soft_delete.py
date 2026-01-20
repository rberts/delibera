"""add status fields for soft delete

Revision ID: 7f4d1c6b9e0a
Revises: 2f92ffe854a3
Create Date: 2026-01-20 16:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "7f4d1c6b9e0a"
down_revision: Union[str, Sequence[str], None] = "2f92ffe854a3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TYPE assembly_status ADD VALUE IF NOT EXISTS 'cancelled'")

    condominium_status = sa.Enum("active", "inactive", name="condominium_status")
    condominium_status.create(op.get_bind(), checkfirst=True)

    op.add_column(
        "condominiums",
        sa.Column("status", condominium_status, nullable=False, server_default="active"),
    )
    op.execute("UPDATE condominiums SET status = 'active' WHERE status IS NULL")
    op.alter_column("condominiums", "status", server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("condominiums", "status")
    op.execute("DROP TYPE IF EXISTS condominium_status")

    op.execute("ALTER TYPE assembly_status RENAME TO assembly_status_old")
    op.execute("CREATE TYPE assembly_status AS ENUM ('draft', 'in_progress', 'finished')")
    op.execute(
        "ALTER TABLE assemblies ALTER COLUMN status TYPE assembly_status "
        "USING status::text::assembly_status"
    )
    op.execute("DROP TYPE assembly_status_old")
