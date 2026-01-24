"""add qr code status

Revision ID: 1b0d4b81b5a4
Revises: 9c7a2b7f0e4a
Create Date: 2026-01-20 18:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "1b0d4b81b5a4"
down_revision: Union[str, Sequence[str], None] = "9c7a2b7f0e4a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    qr_status = sa.Enum("active", "inactive", name="qr_code_status")
    qr_status.create(op.get_bind(), checkfirst=True)

    op.add_column(
        "qr_codes",
        sa.Column("status", qr_status, nullable=False, server_default="active"),
    )
    op.execute("UPDATE qr_codes SET status = 'active' WHERE status IS NULL")
    op.alter_column("qr_codes", "status", server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("qr_codes", "status")
    op.execute("DROP TYPE IF EXISTS qr_code_status")
