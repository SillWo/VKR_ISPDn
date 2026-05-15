"""allow individual entrepreneur requisites

Revision ID: 20260515_0024
Revises: 20260515_0023
Create Date: 2026-05-15 00:24:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260515_0024"
down_revision: str | None = "20260515_0023"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column(
        "organization_card",
        "inn",
        existing_type=sa.String(length=10),
        type_=sa.String(length=12),
        existing_nullable=False,
    )
    op.alter_column(
        "organization_card",
        "ogrn",
        existing_type=sa.String(length=13),
        type_=sa.String(length=15),
        existing_nullable=False,
    )
    op.alter_column(
        "organization_card",
        "kpp",
        existing_type=sa.String(length=9),
        nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "organization_card",
        "kpp",
        existing_type=sa.String(length=9),
        nullable=False,
    )
    op.alter_column(
        "organization_card",
        "ogrn",
        existing_type=sa.String(length=15),
        type_=sa.String(length=13),
        existing_nullable=False,
    )
    op.alter_column(
        "organization_card",
        "inn",
        existing_type=sa.String(length=12),
        type_=sa.String(length=10),
        existing_nullable=False,
    )
