"""create ispdn cards

Revision ID: 20260503_0001
Revises:
Create Date: 2026-05-03 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260503_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "ispdn_cards",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("short_description", sa.Text(), nullable=False),
        sa.Column("processing_purposes", sa.Text(), nullable=False),
        sa.Column("commissioning_date", sa.Date(), nullable=False),
        sa.Column("decommissioning_date", sa.Date(), nullable=True),
        sa.Column("website_url", sa.String(length=2048), nullable=True),
        sa.Column("responsible_person", sa.String(length=255), nullable=False),
        sa.Column("system_composition", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("status IN ('active', 'archived')", name="ck_ispdn_cards_status"),
        sa.CheckConstraint(
            "decommissioning_date IS NULL OR decommissioning_date >= commissioning_date",
            name="ck_ispdn_cards_decommissioning_date",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ispdn_cards_id"), "ispdn_cards", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_ispdn_cards_id"), table_name="ispdn_cards")
    op.drop_table("ispdn_cards")
