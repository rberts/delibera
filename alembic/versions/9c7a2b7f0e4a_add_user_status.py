"""add user status

Revision ID: 9c7a2b7f0e4a
Revises: 4b2c1b1a7c2d
Create Date: 2026-01-20 17:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9c7a2b7f0e4a"
down_revision: Union[str, Sequence[str], None] = "4b2c1b1a7c2d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    user_status = sa.Enum("active", "inactive", name="user_status")
    user_status.create(op.get_bind(), checkfirst=True)

    op.add_column(
        "users",
        sa.Column("status", user_status, nullable=False, server_default="active"),
    )
    op.execute("UPDATE users SET status = 'active' WHERE status IS NULL")
    op.alter_column("users", "status", server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("users", "status")
    op.execute("DROP TYPE IF EXISTS user_status")
