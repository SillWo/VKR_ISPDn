"""create data centers

Revision ID: 20260511_0015
Revises: 20260510_0014
Create Date: 2026-05-11 00:15:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260511_0015"
down_revision: str | None = "20260510_0014"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "data_centers",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("location_country", sa.String(length=255), nullable=False),
        sa.Column("location_address", sa.String(length=1000), nullable=False),
        sa.Column("is_own_data_center", sa.Boolean(), nullable=False),
        sa.Column("owner_organization_type", sa.String(length=64), nullable=True),
        sa.Column("owner_person_full_name", sa.String(length=255), nullable=True),
        sa.Column("owner_organization_name", sa.String(length=255), nullable=True),
        sa.Column("owner_ogrnip", sa.String(length=64), nullable=True),
        sa.Column("owner_ogrn", sa.String(length=64), nullable=True),
        sa.Column("owner_inn", sa.String(length=64), nullable=True),
        sa.Column("owner_location_country", sa.String(length=255), nullable=True),
        sa.Column("owner_location_address", sa.String(length=1000), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("length(trim(name)) > 0", name="ck_data_centers_name_not_empty"),
        sa.CheckConstraint(
            "length(trim(location_country)) > 0",
            name="ck_data_centers_location_country_not_empty",
        ),
        sa.CheckConstraint(
            "length(trim(location_address)) > 0",
            name="ck_data_centers_location_address_not_empty",
        ),
        sa.CheckConstraint(
            (
                "owner_organization_type IN "
                "('individual', 'foreign_organization', 'individual_entrepreneur', 'legal_entity') "
                "OR owner_organization_type IS NULL"
            ),
            name="ck_data_centers_owner_organization_type",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_data_centers_id"), "data_centers", ["id"], unique=False)
    op.create_index(op.f("ix_data_centers_name"), "data_centers", ["name"], unique=False)
    op.create_index(
        op.f("ix_data_centers_location_country"),
        "data_centers",
        ["location_country"],
        unique=False,
    )
    op.create_index(
        op.f("ix_data_centers_is_own_data_center"),
        "data_centers",
        ["is_own_data_center"],
        unique=False,
    )
    op.create_index(
        op.f("ix_data_centers_owner_organization_type"),
        "data_centers",
        ["owner_organization_type"],
        unique=False,
    )

    op.create_table(
        "ispdn_data_centers",
        sa.Column("ispdn_id", sa.Integer(), nullable=False),
        sa.Column("data_center_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(
            ["data_center_id"],
            ["data_centers.id"],
            name="fk_ispdn_data_centers_data_center_id_data_centers",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["ispdn_id"],
            ["ispdn_cards.id"],
            name="fk_ispdn_data_centers_ispdn_id_ispdn_cards",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("ispdn_id", "data_center_id"),
    )
    op.create_index(
        op.f("ix_ispdn_data_centers_ispdn_id"),
        "ispdn_data_centers",
        ["ispdn_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_ispdn_data_centers_data_center_id"),
        "ispdn_data_centers",
        ["data_center_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_ispdn_data_centers_data_center_id"), table_name="ispdn_data_centers")
    op.drop_index(op.f("ix_ispdn_data_centers_ispdn_id"), table_name="ispdn_data_centers")
    op.drop_table("ispdn_data_centers")
    op.drop_index(op.f("ix_data_centers_owner_organization_type"), table_name="data_centers")
    op.drop_index(op.f("ix_data_centers_is_own_data_center"), table_name="data_centers")
    op.drop_index(op.f("ix_data_centers_location_country"), table_name="data_centers")
    op.drop_index(op.f("ix_data_centers_name"), table_name="data_centers")
    op.drop_index(op.f("ix_data_centers_id"), table_name="data_centers")
    op.drop_table("data_centers")
