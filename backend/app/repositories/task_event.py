from __future__ import annotations

from sqlalchemy import and_, case, select
from sqlalchemy.orm import Session, joinedload, selectinload, with_loader_criteria

from app.models.task_event import Task, TaskEvent
from app.schemas.task_event import TaskCreate, TaskUpdate

ACTUAL_TASK_STATUSES = ("pending", "in_progress")


class TaskEventRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_events(
        self,
        ispdn_id: int | None = None,
        task_status: str | None = None,
        importance: str | None = None,
        responsible_employee_id: int | None = None,
        actual_only: bool = False,
    ) -> list[TaskEvent]:
        task_filters = self._build_task_filters(task_status, importance, responsible_employee_id, actual_only)
        statement = (
            select(TaskEvent)
            .options(
                selectinload(TaskEvent.ispdn),
                selectinload(TaskEvent.tasks).selectinload(Task.responsible_employee),
            )
            .order_by(TaskEvent.created_at.desc(), TaskEvent.id.desc())
        )

        if ispdn_id is not None:
            statement = statement.where(TaskEvent.ispdn_id == ispdn_id)

        if task_filters:
            task_criteria = and_(*task_filters)
            statement = statement.join(TaskEvent.tasks).where(task_criteria).distinct()
            statement = statement.options(with_loader_criteria(Task, task_criteria, include_aliases=True))

        return list(self.db.scalars(statement).unique().all())

    def get_event_by_id(self, task_event_id: int) -> TaskEvent | None:
        statement = (
            select(TaskEvent)
            .options(
                selectinload(TaskEvent.ispdn),
                selectinload(TaskEvent.tasks).selectinload(Task.responsible_employee),
            )
            .where(TaskEvent.id == task_event_id)
        )
        return self.db.scalars(statement).unique().first()

    def create_event(
        self,
        ispdn_id: int,
        event_type: str,
        source_module: str,
        title: str,
        description: str | None,
    ) -> TaskEvent:
        task_event = TaskEvent(
            ispdn_id=ispdn_id,
            event_type=event_type,
            source_module=source_module,
            title=title,
            description=description,
        )
        self.db.add(task_event)
        self.db.commit()
        self.db.refresh(task_event)
        return self.get_event_by_id(task_event.id) or task_event

    def create_task(self, task_event: TaskEvent, payload: TaskCreate) -> Task:
        task = Task(task_event_id=task_event.id, **payload.model_dump())
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        return self.get_task_in_event(task_event.id, task.id) or task

    def get_task_in_event(self, task_event_id: int, task_id: int) -> Task | None:
        statement = (
            select(Task)
            .options(
                joinedload(Task.task_event).joinedload(TaskEvent.ispdn),
                joinedload(Task.responsible_employee),
            )
            .where(Task.task_event_id == task_event_id, Task.id == task_id)
        )
        return self.db.scalars(statement).first()

    def update_task(self, task: Task, payload: TaskUpdate) -> Task:
        for field, value in payload.model_dump().items():
            setattr(task, field, value)
        self.db.commit()
        self.db.refresh(task)
        return self.get_task_in_event(task.task_event_id, task.id) or task

    def delete_task(self, task: Task) -> None:
        self.db.delete(task)
        self.db.commit()

    def list_actual_tasks_for_ispdn(self, ispdn_id: int) -> list[Task]:
        importance_order = case(
            (Task.importance == "critical", 1),
            (Task.importance == "high", 2),
            (Task.importance == "medium", 3),
            (Task.importance == "low", 4),
            else_=5,
        )
        deadline_null_order = case((Task.deadline.is_(None), 1), else_=0)
        statement = (
            select(Task)
            .join(Task.task_event)
            .options(
                joinedload(Task.task_event).joinedload(TaskEvent.ispdn),
                joinedload(Task.responsible_employee),
            )
            .where(TaskEvent.ispdn_id == ispdn_id, Task.status.in_(ACTUAL_TASK_STATUSES))
            .order_by(deadline_null_order.asc(), Task.deadline.asc(), importance_order.asc(), Task.created_at.desc())
        )
        return list(self.db.scalars(statement).unique().all())

    @staticmethod
    def _build_task_filters(
        task_status: str | None,
        importance: str | None,
        responsible_employee_id: int | None,
        actual_only: bool,
    ) -> list:
        filters = []
        if task_status is not None:
            filters.append(Task.status == task_status)
        elif actual_only:
            filters.append(Task.status.in_(ACTUAL_TASK_STATUSES))
        if importance is not None:
            filters.append(Task.importance == importance)
        if responsible_employee_id is not None:
            filters.append(Task.responsible_employee_id == responsible_employee_id)
        return filters
