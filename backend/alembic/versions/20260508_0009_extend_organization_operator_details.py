"""extend organization operator details

Revision ID: 20260508_0009
Revises: 20260508_0008
Create Date: 2026-05-08 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260508_0009"
down_revision: str | None = "20260508_0008"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("organization_card", sa.Column("operator_type", sa.String(length=64), nullable=True))
    op.add_column("organization_card", sa.Column("head_office_region", sa.String(length=255), nullable=True))
    op.add_column("organization_card", sa.Column("activity_regions", sa.Text(), nullable=True))
    op.add_column(
        "organization_card",
        sa.Column(
            "postal_address_matches_registration",
            sa.Boolean(),
            server_default=sa.true(),
            nullable=False,
        ),
    )
    op.add_column("organization_card", sa.Column("postal_address", sa.Text(), nullable=True))
    op.add_column("organization_card", sa.Column("phone", sa.String(length=32), nullable=True))
    op.add_column("organization_card", sa.Column("fax", sa.String(length=32), nullable=True))
    op.add_column("organization_card", sa.Column("email", sa.String(length=255), nullable=True))
    op.add_column(
        "organization_card",
        sa.Column("document_approver_employee_id", sa.Integer(), nullable=True),
    )
    op.add_column(
        "organization_card",
        sa.Column("information_security_responsible_employee_id", sa.Integer(), nullable=True),
    )
    op.add_column(
        "organization_card",
        sa.Column("personal_data_processing_responsible_employee_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_org_card_doc_approver_employee",
        "organization_card",
        "employees",
        ["document_approver_employee_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_org_card_info_sec_employee",
        "organization_card",
        "employees",
        ["information_security_responsible_employee_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_org_card_pd_processing_employee",
        "organization_card",
        "employees",
        ["personal_data_processing_responsible_employee_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.create_table(
        "organization_okveds",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("organization_id", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(length=32), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=False), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=False), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organization_card.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_organization_okveds_id"), "organization_okveds", ["id"], unique=False)
    op.create_index(
        op.f("ix_organization_okveds_organization_id"),
        "organization_okveds",
        ["organization_id"],
        unique=False,
    )

    op.create_table(
        "organization_branches",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("organization_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("postal_address", sa.Text(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=False), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=False), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organization_card.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_organization_branches_id"), "organization_branches", ["id"], unique=False)
    op.create_index(
        op.f("ix_organization_branches_organization_id"),
        "organization_branches",
        ["organization_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_organization_branches_organization_id"), table_name="organization_branches")
    op.drop_index(op.f("ix_organization_branches_id"), table_name="organization_branches")
    op.drop_table("organization_branches")
    op.drop_index(op.f("ix_organization_okveds_organization_id"), table_name="organization_okveds")
    op.drop_index(op.f("ix_organization_okveds_id"), table_name="organization_okveds")
    op.drop_table("organization_okveds")

    op.drop_constraint(
        "fk_org_card_pd_processing_employee",
        "organization_card",
        type_="foreignkey",
    )
    op.drop_constraint(
        "fk_org_card_info_sec_employee",
        "organization_card",
        type_="foreignkey",
    )
    op.drop_constraint(
        "fk_org_card_doc_approver_employee",
        "organization_card",
        type_="foreignkey",
    )
    op.drop_column("organization_card", "personal_data_processing_responsible_employee_id")
    op.drop_column("organization_card", "information_security_responsible_employee_id")
    op.drop_column("organization_card", "document_approver_employee_id")
    op.drop_column("organization_card", "email")
    op.drop_column("organization_card", "fax")
    op.drop_column("organization_card", "phone")
    op.drop_column("organization_card", "postal_address")
    op.drop_column("organization_card", "postal_address_matches_registration")
    op.drop_column("organization_card", "activity_regions")
    op.drop_column("organization_card", "head_office_region")
    op.drop_column("organization_card", "operator_type")
