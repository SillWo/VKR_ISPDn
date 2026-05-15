"""make task event ispdn optional

Revision ID: 20260515_0022
Revises: 20260515_0021
Create Date: 2026-05-15 00:22:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260515_0022"
down_revision: str | None = "20260515_0021"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column(
        "task_events",
        "ispdn_id",
        existing_type=sa.Integer(),
        nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "task_events",
        "ispdn_id",
        existing_type=sa.Integer(),
        nullable=False,
    )
