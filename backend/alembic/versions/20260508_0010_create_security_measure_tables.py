"""create security measure tables

Revision ID: 20260508_0010
Revises: 20260508_0009
Create Date: 2026-05-08 00:10:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260508_0010"
down_revision: str | None = "20260508_0009"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "ispdn_security_tools",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("ispdn_id", sa.Integer(), nullable=False),
        sa.Column("dlp", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("siem", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("antivirus", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("ips_ids", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("firewall_utm_ngfw", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("vulnerability_scanner", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("backup_system", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("trusted_boot", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("access_control", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("physical_security", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("other_security_tools", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(
            ["ispdn_id"],
            ["ispdn_cards.id"],
            name="fk_ispdn_security_tools_ispdn_id_ispdn_cards",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("ispdn_id", name="uq_ispdn_security_tools_ispdn_id"),
    )
    op.create_index(op.f("ix_ispdn_security_tools_id"), "ispdn_security_tools", ["id"], unique=False)
    op.create_index(op.f("ix_ispdn_security_tools_ispdn_id"), "ispdn_security_tools", ["ispdn_id"], unique=False)

    op.create_table(
        "technical_security_measure_records",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("ispdn_id", sa.Integer(), nullable=False),
        sa.Column("measure_code", sa.String(length=32), nullable=False),
        sa.Column("factual_status", sa.String(length=32), nullable=False),
        sa.Column("justification_text", sa.Text(), nullable=True),
        sa.Column("justification_file_path", sa.String(length=2048), nullable=True),
        sa.Column("justification_file_name", sa.String(length=255), nullable=True),
        sa.Column("justification_file_content_type", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint(
            "factual_status IN ('implemented', 'not_implemented')",
            name="ck_technical_security_measure_records_factual_status",
        ),
        sa.ForeignKeyConstraint(
            ["ispdn_id"],
            ["ispdn_cards.id"],
            name="fk_technical_security_measure_records_ispdn_id_ispdn_cards",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("ispdn_id", "measure_code", name="uq_technical_security_measure_records_ispdn_measure"),
    )
    op.create_index(
        op.f("ix_technical_security_measure_records_id"),
        "technical_security_measure_records",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_technical_security_measure_records_ispdn_id"),
        "technical_security_measure_records",
        ["ispdn_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_technical_security_measure_records_measure_code"),
        "technical_security_measure_records",
        ["measure_code"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_technical_security_measure_records_measure_code"), table_name="technical_security_measure_records")
    op.drop_index(op.f("ix_technical_security_measure_records_ispdn_id"), table_name="technical_security_measure_records")
    op.drop_index(op.f("ix_technical_security_measure_records_id"), table_name="technical_security_measure_records")
    op.drop_table("technical_security_measure_records")
    op.drop_index(op.f("ix_ispdn_security_tools_ispdn_id"), table_name="ispdn_security_tools")
    op.drop_index(op.f("ix_ispdn_security_tools_id"), table_name="ispdn_security_tools")
    op.drop_table("ispdn_security_tools")
