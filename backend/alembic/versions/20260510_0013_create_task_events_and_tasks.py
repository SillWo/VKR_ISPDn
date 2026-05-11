"""create task events and tasks

Revision ID: 20260510_0013
Revises: 20260510_0012
Create Date: 2026-05-10 00:13:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260510_0013"
down_revision: str | None = "20260510_0012"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "task_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("ispdn_id", sa.Integer(), nullable=False),
        sa.Column("event_type", sa.String(length=128), nullable=False),
        sa.Column("source_module", sa.String(length=128), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("length(trim(event_type)) > 0", name="ck_task_events_event_type_not_empty"),
        sa.CheckConstraint("length(trim(source_module)) > 0", name="ck_task_events_source_module_not_empty"),
        sa.CheckConstraint("length(trim(title)) > 0", name="ck_task_events_title_not_empty"),
        sa.ForeignKeyConstraint(
            ["ispdn_id"],
            ["ispdn_cards.id"],
            name="fk_task_events_ispdn_id_ispdn_cards",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_task_events_id"), "task_events", ["id"], unique=False)
    op.create_index(op.f("ix_task_events_ispdn_id"), "task_events", ["ispdn_id"], unique=False)
    op.create_index(op.f("ix_task_events_event_type"), "task_events", ["event_type"], unique=False)
    op.create_index(op.f("ix_task_events_source_module"), "task_events", ["source_module"], unique=False)
    op.create_index(op.f("ix_task_events_created_at"), "task_events", ["created_at"], unique=False)

    op.create_table(
        "tasks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("task_event_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("importance", sa.String(length=32), nullable=True),
        sa.Column("deadline", sa.Date(), nullable=True),
        sa.Column("responsible_employee_id", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(length=32), server_default="pending", nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("length(trim(title)) > 0", name="ck_tasks_title_not_empty"),
        sa.CheckConstraint(
            "importance IN ('low', 'medium', 'high', 'critical') OR importance IS NULL",
            name="ck_tasks_importance",
        ),
        sa.CheckConstraint("status IN ('pending', 'in_progress', 'done')", name="ck_tasks_status"),
        sa.ForeignKeyConstraint(
            ["task_event_id"],
            ["task_events.id"],
            name="fk_tasks_task_event_id_task_events",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["responsible_employee_id"],
            ["employees.id"],
            name="fk_tasks_responsible_employee_id_employees",
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_tasks_id"), "tasks", ["id"], unique=False)
    op.create_index(op.f("ix_tasks_task_event_id"), "tasks", ["task_event_id"], unique=False)
    op.create_index(op.f("ix_tasks_status"), "tasks", ["status"], unique=False)
    op.create_index(op.f("ix_tasks_importance"), "tasks", ["importance"], unique=False)
    op.create_index(op.f("ix_tasks_deadline"), "tasks", ["deadline"], unique=False)
    op.create_index(op.f("ix_tasks_responsible_employee_id"), "tasks", ["responsible_employee_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_tasks_responsible_employee_id"), table_name="tasks")
    op.drop_index(op.f("ix_tasks_deadline"), table_name="tasks")
    op.drop_index(op.f("ix_tasks_importance"), table_name="tasks")
    op.drop_index(op.f("ix_tasks_status"), table_name="tasks")
    op.drop_index(op.f("ix_tasks_task_event_id"), table_name="tasks")
    op.drop_index(op.f("ix_tasks_id"), table_name="tasks")
    op.drop_table("tasks")
    op.drop_index(op.f("ix_task_events_created_at"), table_name="task_events")
    op.drop_index(op.f("ix_task_events_source_module"), table_name="task_events")
    op.drop_index(op.f("ix_task_events_event_type"), table_name="task_events")
    op.drop_index(op.f("ix_task_events_ispdn_id"), table_name="task_events")
    op.drop_index(op.f("ix_task_events_id"), table_name="task_events")
    op.drop_table("task_events")
