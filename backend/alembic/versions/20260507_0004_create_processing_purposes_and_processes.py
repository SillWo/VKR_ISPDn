"""create processing purposes and processes

Revision ID: 20260507_0004
Revises: 20260507_0003
Create Date: 2026-05-07 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260507_0004"
down_revision: str | None = "20260507_0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "processing_purposes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("processing_period", sa.String(length=1000), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("length(trim(name)) > 0", name="ck_processing_purposes_name_not_empty"),
        sa.CheckConstraint(
            "length(trim(processing_period)) > 0",
            name="ck_processing_purposes_processing_period_not_empty",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name", name="uq_processing_purposes_name"),
    )
    op.create_index(op.f("ix_processing_purposes_id"), "processing_purposes", ["id"], unique=False)

    op.create_table(
        "processing_processes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("ispdn_id", sa.Integer(), nullable=False),
        sa.Column("processing_purpose_id", sa.Integer(), nullable=False),
        sa.Column("subject_categories", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("data_categories", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("legal_bases", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("personal_data_actions", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("processing_type", sa.String(length=32), nullable=False),
        sa.Column("internal_network_transfer", sa.String(length=64), nullable=False),
        sa.Column("internet_transfer", sa.String(length=64), nullable=False),
        sa.Column("cross_border_transfer", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint(
            "processing_type IN ('automated', 'non_automated', 'mixed')",
            name="ck_processing_processes_processing_type",
        ),
        sa.CheckConstraint(
            "internal_network_transfer IN ('no_internal_network_transfer', 'with_internal_network_transfer')",
            name="ck_processing_processes_internal_network_transfer",
        ),
        sa.CheckConstraint(
            "internet_transfer IN ('no_internet_transfer', 'with_internet_transfer')",
            name="ck_processing_processes_internet_transfer",
        ),
        sa.ForeignKeyConstraint(
            ["ispdn_id"],
            ["ispdn_cards.id"],
            name="fk_processing_processes_ispdn_id_ispdn_cards",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["processing_purpose_id"],
            ["processing_purposes.id"],
            name="fk_processing_processes_purpose_id_purposes",
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_processing_processes_id"), "processing_processes", ["id"], unique=False)
    op.create_index(op.f("ix_processing_processes_ispdn_id"), "processing_processes", ["ispdn_id"], unique=False)
    op.create_index(
        op.f("ix_processing_processes_processing_purpose_id"),
        "processing_processes",
        ["processing_purpose_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_processing_processes_processing_purpose_id"), table_name="processing_processes")
    op.drop_index(op.f("ix_processing_processes_ispdn_id"), table_name="processing_processes")
    op.drop_index(op.f("ix_processing_processes_id"), table_name="processing_processes")
    op.drop_table("processing_processes")

    op.drop_index(op.f("ix_processing_purposes_id"), table_name="processing_purposes")
    op.drop_table("processing_purposes")
