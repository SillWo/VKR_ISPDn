from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.employee import Employee
    from app.models.ispdn import IspdnCard


class TaskEvent(Base):
    __tablename__ = "task_events"
    __table_args__ = (
        CheckConstraint("length(trim(event_type)) > 0", name="ck_task_events_event_type_not_empty"),
        CheckConstraint("length(trim(source_module)) > 0", name="ck_task_events_source_module_not_empty"),
        CheckConstraint("length(trim(title)) > 0", name="ck_task_events_title_not_empty"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    ispdn_id: Mapped[int] = mapped_column(
        ForeignKey("ispdn_cards.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    event_type: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    source_module: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        nullable=False,
        server_default=func.now(),
        index=True,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    ispdn: Mapped["IspdnCard"] = relationship(back_populates="task_events")
    tasks: Mapped[list["Task"]] = relationship(
        back_populates="task_event",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by=lambda: Task.created_at.desc(),
    )


class Task(Base):
    __tablename__ = "tasks"
    __table_args__ = (
        CheckConstraint("length(trim(title)) > 0", name="ck_tasks_title_not_empty"),
        CheckConstraint(
            "importance IN ('low', 'medium', 'high', 'critical') OR importance IS NULL",
            name="ck_tasks_importance",
        ),
        CheckConstraint("status IN ('pending', 'in_progress', 'done')", name="ck_tasks_status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    task_event_id: Mapped[int] = mapped_column(
        ForeignKey("task_events.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    importance: Mapped[str | None] = mapped_column(String(32), nullable=True, index=True)
    deadline: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    responsible_employee_id: Mapped[int | None] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending", server_default="pending", index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    task_event: Mapped[TaskEvent] = relationship(back_populates="tasks")
    responsible_employee: Mapped["Employee | None"] = relationship(back_populates="task_responsibilities")
