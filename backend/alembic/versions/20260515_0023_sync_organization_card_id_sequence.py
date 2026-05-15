"""sync organization card id sequence

Revision ID: 20260515_0023
Revises: 20260515_0022
Create Date: 2026-05-15 00:23:00.000000

"""

from collections.abc import Sequence

from alembic import op

revision: str = "20260515_0023"
down_revision: str | None = "20260515_0022"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        """
        SELECT setval(
            pg_get_serial_sequence('organization_card', 'id'),
            COALESCE((SELECT MAX(id) FROM organization_card), 1),
            (SELECT COUNT(*) > 0 FROM organization_card)
        )
        """,
    )


def downgrade() -> None:
    pass
