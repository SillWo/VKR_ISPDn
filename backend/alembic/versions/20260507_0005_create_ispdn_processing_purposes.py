"""create ispdn processing purposes

Revision ID: 20260507_0005
Revises: 20260507_0004
Create Date: 2026-05-07 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260507_0005"
down_revision: str | None = "20260507_0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "ispdn_processing_purposes",
        sa.Column("ispdn_id", sa.Integer(), nullable=False),
        sa.Column("processing_purpose_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["ispdn_id"],
            ["ispdn_cards.id"],
            name="fk_ispdn_processing_purposes_ispdn_id_ispdn_cards",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["processing_purpose_id"],
            ["processing_purposes.id"],
            name="fk_ispdn_processing_purposes_purpose_id_purposes",
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("ispdn_id", "processing_purpose_id"),
    )
    op.create_index(
        op.f("ix_ispdn_processing_purposes_ispdn_id"),
        "ispdn_processing_purposes",
        ["ispdn_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_ispdn_processing_purposes_processing_purpose_id"),
        "ispdn_processing_purposes",
        ["processing_purpose_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_ispdn_processing_purposes_processing_purpose_id"),
        table_name="ispdn_processing_purposes",
    )
    op.drop_index(op.f("ix_ispdn_processing_purposes_ispdn_id"), table_name="ispdn_processing_purposes")
    op.drop_table("ispdn_processing_purposes")
