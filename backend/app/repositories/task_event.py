from __future__ import annotations

from datetime import date

from sqlalchemy import and_, case, delete, select
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
        organization_id: int | None = None,
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

        if organization_id is not None:
            statement = statement.where(TaskEvent.organization_id == organization_id)

        if ispdn_id is not None:
            statement = statement.where(TaskEvent.ispdn_id == ispdn_id)

        if task_filters:
            task_criteria = and_(*task_filters)
            statement = statement.join(TaskEvent.tasks).where(task_criteria).distinct()
            statement = statement.options(with_loader_criteria(Task, task_criteria, include_aliases=True))

        return list(self.db.scalars(statement).unique().all())

    def get_event_by_id(self, task_event_id: int, organization_id: int | None = None) -> TaskEvent | None:
        statement = (
            select(TaskEvent)
            .options(
                selectinload(TaskEvent.ispdn),
                selectinload(TaskEvent.tasks).selectinload(Task.responsible_employee),
            )
            .where(TaskEvent.id == task_event_id)
        )
        if organization_id is not None:
            statement = statement.where(TaskEvent.organization_id == organization_id)
        return self.db.scalars(statement).unique().first()

    def create_event(
        self,
        ispdn_id: int,
        event_type: str,
        source_module: str,
        title: str,
        description: str | None,
        organization_id: int,
        automation_key: str | None = None,
    ) -> TaskEvent:
        task_event = TaskEvent(
            ispdn_id=ispdn_id,
            organization_id=organization_id,
            event_type=event_type,
            source_module=source_module,
            title=title,
            description=description,
            automation_key=automation_key,
        )
        self.db.add(task_event)
        self.db.commit()
        self.db.refresh(task_event)
        return self.get_event_by_id(task_event.id, organization_id) or task_event

    def get_event_by_automation_key(self, automation_key: str, organization_id: int | None = None) -> TaskEvent | None:
        statement = (
            select(TaskEvent)
            .options(
                selectinload(TaskEvent.ispdn),
                selectinload(TaskEvent.tasks).selectinload(Task.responsible_employee),
            )
            .where(TaskEvent.automation_key == automation_key)
        )
        if organization_id is not None:
            statement = statement.where(TaskEvent.organization_id == organization_id)
        return self.db.scalars(statement).unique().first()

    def create_event_once(
        self,
        *,
        ispdn_id: int,
        event_type: str,
        source_module: str,
        title: str,
        description: str | None,
        automation_key: str,
        organization_id: int,
    ) -> TaskEvent:
        existing_event = self.get_event_by_automation_key(automation_key, organization_id)
        if existing_event is not None:
            return existing_event
        return self.create_event(
            ispdn_id=ispdn_id,
            event_type=event_type,
            source_module=source_module,
            title=title,
            description=description,
            organization_id=organization_id,
            automation_key=automation_key,
        )

    def create_task(self, task_event: TaskEvent, payload: TaskCreate) -> Task:
        task = Task(task_event_id=task_event.id, **payload.model_dump())
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        return self.get_task_in_event(task_event.id, task.id) or task

    def get_task_by_automation_key(self, task_event_id: int, automation_key: str) -> Task | None:
        statement = (
            select(Task)
            .options(
                joinedload(Task.task_event).joinedload(TaskEvent.ispdn),
                joinedload(Task.responsible_employee),
            )
            .where(Task.task_event_id == task_event_id, Task.automation_key == automation_key)
        )
        return self.db.scalars(statement).first()

    def create_task_once(
        self,
        *,
        task_event_id: int,
        title: str,
        description: str | None,
        importance: str | None,
        status: str,
        automation_key: str,
        responsible_employee_id: int | None = None,
        deadline: date | None = None,
    ) -> Task:
        existing_task = self.get_task_by_automation_key(task_event_id, automation_key)
        if existing_task is not None:
            return existing_task
        task = Task(
            task_event_id=task_event_id,
            title=title,
            description=description,
            importance=importance,
            status=status,
            automation_key=automation_key,
            responsible_employee_id=responsible_employee_id,
            deadline=deadline,
        )
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        return self.get_task_by_automation_key(task_event_id, automation_key) or task

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

    def update_task_status(self, task: Task, status: str) -> Task:
        task.status = status
        self.db.commit()
        self.db.refresh(task)
        return self.get_task_in_event(task.task_event_id, task.id) or task

    def update_task_importance(self, task: Task, importance: str | None) -> Task:
        task.importance = importance
        self.db.commit()
        self.db.refresh(task)
        return self.get_task_in_event(task.task_event_id, task.id) or task

    def delete_task(self, task: Task) -> None:
        self.db.delete(task)
        self.db.commit()

    def mark_task_done(self, task: Task) -> Task:
        task.status = "done"
        self.db.commit()
        self.db.refresh(task)
        return self.get_task_in_event(task.task_event_id, task.id) or task

    def delete_all_events_and_tasks(self) -> None:
        self.db.execute(delete(Task))
        self.db.execute(delete(TaskEvent))
        self.db.commit()

    def list_actual_tasks_for_ispdn(self, ispdn_id: int, organization_id: int) -> list[Task]:
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
            .where(
                TaskEvent.ispdn_id == ispdn_id,
                TaskEvent.organization_id == organization_id,
                Task.status.in_(ACTUAL_TASK_STATUSES),
            )
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
