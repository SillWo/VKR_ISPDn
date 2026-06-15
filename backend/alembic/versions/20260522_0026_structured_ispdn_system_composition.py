"""structured ispdn system composition

Revision ID: 20260522_0026
Revises: 20260515_0025
Create Date: 2026-05-22 00:26:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260522_0026"
down_revision: str | None = "20260515_0025"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

LEGACY_ITEM_NAME = "\u0421\u043e\u0441\u0442\u0430\u0432 \u0418\u0421\u041f\u0414\u043d"


def upgrade() -> None:
    op.create_table(
        "ispdn_system_composition_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("ispdn_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["ispdn_id"],
            ["ispdn_cards.id"],
            name="fk_ispdn_system_composition_items_ispdn_id_ispdn_cards",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_ispdn_system_composition_items_id"),
        "ispdn_system_composition_items",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_ispdn_system_composition_items_ispdn_id"),
        "ispdn_system_composition_items",
        ["ispdn_id"],
        unique=False,
    )

    connection = op.get_bind()
    connection.execute(
        sa.text(
            """
            INSERT INTO ispdn_system_composition_items (ispdn_id, name, description, sort_order)
            SELECT id, :name, system_composition, 0
            FROM ispdn_cards
            """
        ),
        {"name": LEGACY_ITEM_NAME},
    )

    op.drop_column("ispdn_cards", "system_composition")


def downgrade() -> None:
    op.add_column("ispdn_cards", sa.Column("system_composition", sa.Text(), nullable=True))

    connection = op.get_bind()
    connection.execute(
        sa.text(
            """
            UPDATE ispdn_cards
            SET system_composition = COALESCE(items.system_composition, '')
            FROM (
                SELECT
                    ispdn_id,
                    string_agg(name || ': ' || description, E'\n' ORDER BY sort_order, id) AS system_composition
                FROM ispdn_system_composition_items
                GROUP BY ispdn_id
            ) AS items
            WHERE ispdn_cards.id = items.ispdn_id
            """
        )
    )
    connection.execute(
        sa.text("UPDATE ispdn_cards SET system_composition = '' WHERE system_composition IS NULL")
    )
    op.alter_column("ispdn_cards", "system_composition", existing_type=sa.Text(), nullable=False)

    op.drop_index(op.f("ix_ispdn_system_composition_items_ispdn_id"), table_name="ispdn_system_composition_items")
    op.drop_index(op.f("ix_ispdn_system_composition_items_id"), table_name="ispdn_system_composition_items")
    op.drop_table("ispdn_system_composition_items")
