"""add rkn office address to organization

Revision ID: 20260511_0018
Revises: 20260511_0017
Create Date: 2026-05-11 01:18:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260511_0018"
down_revision: str | None = "20260511_0017"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("organization_card", sa.Column("rkn_office_address", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("organization_card", "rkn_office_address")
