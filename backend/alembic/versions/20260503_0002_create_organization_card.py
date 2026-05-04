"""create organization card

Revision ID: 20260503_0002
Revises: 20260503_0001
Create Date: 2026-05-03 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260503_0002"
down_revision: str | None = "20260503_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "organization_card",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("short_legal_name", sa.String(length=255), nullable=False),
        sa.Column("full_legal_name", sa.Text(), nullable=False),
        sa.Column("inn", sa.String(length=10), nullable=False),
        sa.Column("ogrn", sa.String(length=13), nullable=False),
        sa.Column("kpp", sa.String(length=9), nullable=False),
        sa.Column("head_full_name", sa.String(length=255), nullable=False),
        sa.Column("head_position", sa.String(length=255), nullable=False),
        sa.Column("registration_address", sa.Text(), nullable=False),
        sa.Column("registration_city", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("id = 1", name="ck_organization_card_singleton_id"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_organization_card_id"), "organization_card", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_organization_card_id"), table_name="organization_card")
    op.drop_table("organization_card")
