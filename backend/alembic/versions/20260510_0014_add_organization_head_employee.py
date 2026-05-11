"""add organization head employee

Revision ID: 20260510_0014
Revises: 20260510_0013
Create Date: 2026-05-10 00:14:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260510_0014"
down_revision: str | None = "20260510_0013"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("organization_card", sa.Column("head_employee_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_org_card_head_employee",
        "organization_card",
        "employees",
        ["head_employee_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.alter_column("organization_card", "head_full_name", existing_type=sa.String(length=255), nullable=True)
    op.alter_column("organization_card", "head_position", existing_type=sa.String(length=255), nullable=True)


def downgrade() -> None:
    op.execute("UPDATE organization_card SET head_position = '' WHERE head_position IS NULL")
    op.execute("UPDATE organization_card SET head_full_name = '' WHERE head_full_name IS NULL")
    op.alter_column("organization_card", "head_position", existing_type=sa.String(length=255), nullable=False)
    op.alter_column("organization_card", "head_full_name", existing_type=sa.String(length=255), nullable=False)
    op.drop_constraint("fk_org_card_head_employee", "organization_card", type_="foreignkey")
    op.drop_column("organization_card", "head_employee_id")
