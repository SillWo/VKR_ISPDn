"""create crypto tools and extend employee organization

Revision ID: 20260511_0016
Revises: 20260511_0015
Create Date: 2026-05-11 00:16:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260511_0016"
down_revision: str | None = "20260511_0015"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "crypto_tools",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("crypto_class", sa.String(length=16), nullable=False),
        sa.Column("manufacturer", sa.String(length=255), nullable=False),
        sa.Column("serial_number", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("length(trim(name)) > 0", name="ck_crypto_tools_name_not_empty"),
        sa.CheckConstraint("length(trim(manufacturer)) > 0", name="ck_crypto_tools_manufacturer_not_empty"),
        sa.CheckConstraint("length(trim(serial_number)) > 0", name="ck_crypto_tools_serial_number_not_empty"),
        sa.CheckConstraint(
            "crypto_class IN ('KS1', 'KS2', 'KS3', 'KV', 'KA')",
            name="ck_crypto_tools_crypto_class",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_crypto_tools_id"), "crypto_tools", ["id"], unique=False)
    op.create_index(op.f("ix_crypto_tools_name"), "crypto_tools", ["name"], unique=False)
    op.create_index(op.f("ix_crypto_tools_crypto_class"), "crypto_tools", ["crypto_class"], unique=False)
    op.create_index(op.f("ix_crypto_tools_manufacturer"), "crypto_tools", ["manufacturer"], unique=False)
    op.create_index(op.f("ix_crypto_tools_serial_number"), "crypto_tools", ["serial_number"], unique=False)

    op.create_table(
        "ispdn_cryptography_settings",
        sa.Column("ispdn_id", sa.Integer(), nullable=False),
        sa.Column("uses_cryptography", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(
            ["ispdn_id"],
            ["ispdn_cards.id"],
            name="fk_ispdn_cryptography_settings_ispdn_id_ispdn_cards",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("ispdn_id"),
    )

    op.create_table(
        "ispdn_crypto_tools",
        sa.Column("ispdn_id", sa.Integer(), nullable=False),
        sa.Column("crypto_tool_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(
            ["crypto_tool_id"],
            ["crypto_tools.id"],
            name="fk_ispdn_crypto_tools_crypto_tool_id_crypto_tools",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["ispdn_id"],
            ["ispdn_cards.id"],
            name="fk_ispdn_crypto_tools_ispdn_id_ispdn_cards",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("ispdn_id", "crypto_tool_id"),
    )
    op.create_index(op.f("ix_ispdn_crypto_tools_ispdn_id"), "ispdn_crypto_tools", ["ispdn_id"], unique=False)
    op.create_index(
        op.f("ix_ispdn_crypto_tools_crypto_tool_id"),
        "ispdn_crypto_tools",
        ["crypto_tool_id"],
        unique=False,
    )

    op.add_column("employees", sa.Column("phone_number", sa.String(length=32), nullable=True))
    op.add_column("employees", sa.Column("email", sa.String(length=255), nullable=True))

    op.add_column(
        "organization_card",
        sa.Column("personal_data_processing_termination_type", sa.String(length=32), nullable=True),
    )
    op.add_column(
        "organization_card",
        sa.Column("personal_data_processing_termination_date", sa.Date(), nullable=True),
    )
    op.add_column(
        "organization_card",
        sa.Column("personal_data_processing_termination_condition", sa.Text(), nullable=True),
    )
    op.create_check_constraint(
        "ck_organization_card_processing_termination_type",
        "organization_card",
        (
            "personal_data_processing_termination_type IN ('end_date', 'end_condition') "
            "OR personal_data_processing_termination_type IS NULL"
        ),
    )


def downgrade() -> None:
    op.drop_constraint(
        "ck_organization_card_processing_termination_type",
        "organization_card",
        type_="check",
    )
    op.drop_column("organization_card", "personal_data_processing_termination_condition")
    op.drop_column("organization_card", "personal_data_processing_termination_date")
    op.drop_column("organization_card", "personal_data_processing_termination_type")
    op.drop_column("employees", "email")
    op.drop_column("employees", "phone_number")
    op.drop_index(op.f("ix_ispdn_crypto_tools_crypto_tool_id"), table_name="ispdn_crypto_tools")
    op.drop_index(op.f("ix_ispdn_crypto_tools_ispdn_id"), table_name="ispdn_crypto_tools")
    op.drop_table("ispdn_crypto_tools")
    op.drop_table("ispdn_cryptography_settings")
    op.drop_index(op.f("ix_crypto_tools_serial_number"), table_name="crypto_tools")
    op.drop_index(op.f("ix_crypto_tools_manufacturer"), table_name="crypto_tools")
    op.drop_index(op.f("ix_crypto_tools_crypto_class"), table_name="crypto_tools")
    op.drop_index(op.f("ix_crypto_tools_name"), table_name="crypto_tools")
    op.drop_index(op.f("ix_crypto_tools_id"), table_name="crypto_tools")
    op.drop_table("crypto_tools")
