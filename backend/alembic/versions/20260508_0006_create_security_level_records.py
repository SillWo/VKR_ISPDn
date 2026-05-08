"""create security level records

Revision ID: 20260508_0006
Revises: 20260507_0005
Create Date: 2026-05-08 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260508_0006"
down_revision: str | None = "20260507_0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "security_level_records",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("ispdn_id", sa.Integer(), nullable=False),
        sa.Column("data_categories", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("primary_data_category", sa.String(length=32), nullable=False),
        sa.Column("subject_count_range", sa.String(length=32), nullable=False),
        sa.Column("threat_type", sa.String(length=32), nullable=False),
        sa.Column("subject_group", sa.String(length=32), nullable=False),
        sa.Column("employee_only", sa.Boolean(), nullable=False),
        sa.Column("recommended_level", sa.Integer(), nullable=False),
        sa.Column("actual_level", sa.Integer(), nullable=False),
        sa.Column("actual_level_matches_recommended", sa.Boolean(), nullable=False),
        sa.Column("deviation_justification_text", sa.Text(), nullable=True),
        sa.Column("deviation_justification_file_path", sa.String(length=2048), nullable=True),
        sa.Column("deviation_justification_file_name", sa.String(length=255), nullable=True),
        sa.Column("deviation_justification_file_content_type", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint(
            "subject_count_range IN ('more_than_100k', 'less_than_100k')",
            name="ck_security_level_subject_count_range",
        ),
        sa.CheckConstraint(
            "threat_type IN ('threat_type_1', 'threat_type_2', 'threat_type_3')",
            name="ck_security_level_threat_type",
        ),
        sa.CheckConstraint(
            "subject_group IN ('clients_only', 'employees_only', 'employees_and_clients')",
            name="ck_security_level_subject_group",
        ),
        sa.CheckConstraint("recommended_level IN (1, 2, 3, 4)", name="ck_security_level_recommended_level"),
        sa.CheckConstraint("actual_level IN (1, 2, 3, 4)", name="ck_security_level_actual_level"),
        sa.ForeignKeyConstraint(
            ["ispdn_id"],
            ["ispdn_cards.id"],
            name="fk_security_level_records_ispdn_id_ispdn_cards",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("ispdn_id", name="uq_security_level_records_ispdn_id"),
    )
    op.create_index(op.f("ix_security_level_records_id"), "security_level_records", ["id"], unique=False)
    op.create_index(op.f("ix_security_level_records_ispdn_id"), "security_level_records", ["ispdn_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_security_level_records_ispdn_id"), table_name="security_level_records")
    op.drop_index(op.f("ix_security_level_records_id"), table_name="security_level_records")
    op.drop_table("security_level_records")
