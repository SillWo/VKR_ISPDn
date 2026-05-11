"""add organization statistical codes

Revision ID: 20260508_0008
Revises: 20260508_0007
Create Date: 2026-05-08 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260508_0008"
down_revision: str | None = "20260508_0007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("organization_card", sa.Column("okved", sa.String(length=32), nullable=True))
    op.add_column("organization_card", sa.Column("okpo", sa.String(length=32), nullable=True))
    op.add_column("organization_card", sa.Column("okfs", sa.String(length=32), nullable=True))
    op.add_column("organization_card", sa.Column("okogu", sa.String(length=32), nullable=True))
    op.add_column("organization_card", sa.Column("okopf", sa.String(length=32), nullable=True))


def downgrade() -> None:
    op.drop_column("organization_card", "okopf")
    op.drop_column("organization_card", "okogu")
    op.drop_column("organization_card", "okfs")
    op.drop_column("organization_card", "okpo")
    op.drop_column("organization_card", "okved")
