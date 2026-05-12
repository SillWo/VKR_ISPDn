"""add task automation keys and cleanup old tasks

Revision ID: 20260512_0019
Revises: 20260511_0018
Create Date: 2026-05-12 00:19:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260512_0019"
down_revision: str | None = "20260511_0018"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("task_events", sa.Column("automation_key", sa.String(length=255), nullable=True))
    op.create_index(op.f("ix_task_events_automation_key"), "task_events", ["automation_key"], unique=True)

    op.add_column("tasks", sa.Column("automation_key", sa.String(length=255), nullable=True))
    op.create_index(op.f("ix_tasks_automation_key"), "tasks", ["automation_key"], unique=False)
    op.create_unique_constraint("uq_tasks_event_automation_key", "tasks", ["task_event_id", "automation_key"])

    op.execute("DELETE FROM tasks")
    op.execute("DELETE FROM task_events")


def downgrade() -> None:
    op.drop_constraint("uq_tasks_event_automation_key", "tasks", type_="unique")
    op.drop_index(op.f("ix_tasks_automation_key"), table_name="tasks")
    op.drop_column("tasks", "automation_key")

    op.drop_index(op.f("ix_task_events_automation_key"), table_name="task_events")
    op.drop_column("task_events", "automation_key")
