"""create control events

Revision ID: 20260510_0012
Revises: 20260508_0011
Create Date: 2026-05-10 00:12:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260510_0012"
down_revision: str | None = "20260508_0011"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "control_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("length(trim(name)) > 0", name="ck_control_events_name_not_empty"),
        sa.CheckConstraint("length(trim(description)) > 0", name="ck_control_events_description_not_empty"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name", name="uq_control_events_name"),
    )
    op.create_index(op.f("ix_control_events_id"), "control_events", ["id"], unique=False)

    op.create_table(
        "control_event_files",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("control_event_id", sa.Integer(), nullable=False),
        sa.Column("file_path", sa.String(length=2048), nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("file_content_type", sa.String(length=255), nullable=False),
        sa.Column("file_size_bytes", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(
            ["control_event_id"],
            ["control_events.id"],
            name="fk_control_event_files_control_event_id_control_events",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_control_event_files_id"), "control_event_files", ["id"], unique=False)
    op.create_index(
        op.f("ix_control_event_files_control_event_id"),
        "control_event_files",
        ["control_event_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_control_event_files_control_event_id"), table_name="control_event_files")
    op.drop_index(op.f("ix_control_event_files_id"), table_name="control_event_files")
    op.drop_table("control_event_files")
    op.drop_index(op.f("ix_control_events_id"), table_name="control_events")
    op.drop_table("control_events")
