"""create employee registry

Revision ID: 20260507_0003
Revises: 20260503_0002
Create Date: 2026-05-07 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260507_0003"
down_revision: str | None = "20260503_0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "departments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name", name="uq_departments_name"),
    )
    op.create_index(op.f("ix_departments_id"), "departments", ["id"], unique=False)

    op.create_table(
        "employees",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("position", sa.String(length=255), nullable=False),
        sa.Column("document_initials", sa.String(length=255), nullable=False),
        sa.Column("department_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(
            ["department_id"],
            ["departments.id"],
            name="fk_employees_department_id_departments",
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_employees_id"), "employees", ["id"], unique=False)
    op.create_index(op.f("ix_employees_department_id"), "employees", ["department_id"], unique=False)

    op.add_column("ispdn_cards", sa.Column("responsible_employee_id", sa.Integer(), nullable=True))
    op.create_index(
        op.f("ix_ispdn_cards_responsible_employee_id"),
        "ispdn_cards",
        ["responsible_employee_id"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_ispdn_cards_responsible_employee_id_employees",
        "ispdn_cards",
        "employees",
        ["responsible_employee_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_ispdn_cards_responsible_employee_id_employees",
        "ispdn_cards",
        type_="foreignkey",
    )
    op.drop_index(op.f("ix_ispdn_cards_responsible_employee_id"), table_name="ispdn_cards")
    op.drop_column("ispdn_cards", "responsible_employee_id")

    op.drop_index(op.f("ix_employees_department_id"), table_name="employees")
    op.drop_index(op.f("ix_employees_id"), table_name="employees")
    op.drop_table("employees")

    op.drop_index(op.f("ix_departments_id"), table_name="departments")
    op.drop_table("departments")
