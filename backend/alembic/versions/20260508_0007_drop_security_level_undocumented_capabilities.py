"""drop security level undocumented capabilities

Revision ID: 20260508_0007
Revises: 20260508_0006
Create Date: 2026-05-08 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260508_0007"
down_revision: str | None = "20260508_0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("ALTER TABLE security_level_records DROP CONSTRAINT IF EXISTS ck_security_level_undocumented_capabilities")
    op.execute("ALTER TABLE security_level_records DROP COLUMN IF EXISTS undocumented_capabilities")


def downgrade() -> None:
    op.add_column(
        "security_level_records",
        sa.Column("undocumented_capabilities", sa.String(length=64), nullable=True),
    )
    op.execute("UPDATE security_level_records SET undocumented_capabilities = 'no_ndv' WHERE undocumented_capabilities IS NULL")
    op.alter_column("security_level_records", "undocumented_capabilities", nullable=False)
    op.create_check_constraint(
        "ck_security_level_undocumented_capabilities",
        "security_level_records",
        "undocumented_capabilities IN ('ndv_application_software', 'ndv_operating_system', 'no_ndv', 'ndv_application_and_operating_system')",
    )
