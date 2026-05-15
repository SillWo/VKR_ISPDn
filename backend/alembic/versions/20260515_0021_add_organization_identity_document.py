"""add organization identity document fields

Revision ID: 20260515_0021
Revises: 20260514_0020
Create Date: 2026-05-15 00:21:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260515_0021"
down_revision: str | None = "20260514_0020"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("organization_card", sa.Column("identity_document_type", sa.String(length=64), nullable=True))
    op.add_column("organization_card", sa.Column("identity_document_name", sa.String(length=255), nullable=True))
    op.add_column("organization_card", sa.Column("identity_document_series", sa.String(length=32), nullable=True))
    op.add_column("organization_card", sa.Column("identity_document_number", sa.String(length=32), nullable=True))
    op.add_column("organization_card", sa.Column("identity_document_issued_by", sa.Text(), nullable=True))
    op.add_column("organization_card", sa.Column("identity_document_issued_date", sa.Date(), nullable=True))
    op.alter_column(
        "organization_card",
        "short_legal_name",
        existing_type=sa.String(length=255),
        nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "organization_card",
        "short_legal_name",
        existing_type=sa.String(length=255),
        nullable=False,
    )
    op.drop_column("organization_card", "identity_document_issued_date")
    op.drop_column("organization_card", "identity_document_issued_by")
    op.drop_column("organization_card", "identity_document_number")
    op.drop_column("organization_card", "identity_document_series")
    op.drop_column("organization_card", "identity_document_name")
    op.drop_column("organization_card", "identity_document_type")
