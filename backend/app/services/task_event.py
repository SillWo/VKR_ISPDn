from app.models.task_event import Task, TaskEvent
from app.repositories.employee import EmployeeRepository
from app.repositories.ispdn import IspdnRepository
from app.repositories.task_event import TaskEventRepository
from app.schemas.task_event import ActualTaskRead, TaskCreate, TaskEventCreate, TaskImportance, TaskStatus, TaskUpdate


class TaskEventNotFoundError(Exception):
    pass


class TaskNotFoundError(Exception):
    pass


class TaskEventIspdnNotFoundError(Exception):
    pass


class TaskEventIspdnArchivedError(Exception):
    pass


class TaskResponsibleEmployeeNotFoundError(Exception):
    pass


class TaskEventService:
    def __init__(
        self,
        repository: TaskEventRepository,
        ispdn_repository: IspdnRepository,
        employee_repository: EmployeeRepository,
    ) -> None:
        self.repository = repository
        self.ispdn_repository = ispdn_repository
        self.employee_repository = employee_repository

    def list_events(
        self,
        ispdn_id: int | None = None,
        task_status: str | None = None,
        importance: str | None = None,
        responsible_employee_id: int | None = None,
        actual_only: bool = False,
        organization_id: int | None = None,
    ) -> list[TaskEvent]:
        if ispdn_id is not None:
            self._ensure_ispdn_exists(ispdn_id, organization_id)
        if responsible_employee_id is not None:
            self._ensure_employee_exists(responsible_employee_id, organization_id)
        return self.repository.list_events(
            ispdn_id=ispdn_id,
            task_status=task_status,
            importance=importance,
            responsible_employee_id=responsible_employee_id,
            actual_only=actual_only,
            organization_id=organization_id,
        )

    def get_event(self, task_event_id: int, organization_id: int | None = None) -> TaskEvent:
        task_event = self.repository.get_event_by_id(task_event_id, organization_id)
        if task_event is None:
            raise TaskEventNotFoundError
        return task_event

    def create_manual_event(self, payload: TaskEventCreate, organization_id: int) -> TaskEvent:
        if payload.ispdn_id is not None:
            ispdn = self.ispdn_repository.get_by_id(payload.ispdn_id, organization_id)
            if ispdn is None:
                raise TaskEventIspdnNotFoundError
            if ispdn.status != "active":
                raise TaskEventIspdnArchivedError
        task_event = self.repository.create_event(
            ispdn_id=payload.ispdn_id,
            event_type="manual",
            source_module="manual",
            title=self._strip_required(payload.title),
            description=self._normalize_optional_text(payload.description),
            organization_id=organization_id,
            automation_key=None,
        )
        return self.get_event(task_event.id, organization_id)

    def create_system_event(
        self,
        ispdn_id: int,
        event_type: str,
        source_module: str,
        title: str,
        description: str | None = None,
        tasks: list[TaskCreate] | None = None,
        automation_key: str | None = None,
        organization_id: int | None = None,
    ) -> TaskEvent:
        self._ensure_ispdn_exists(ispdn_id, organization_id)
        event_title = self._strip_required(title)
        event_type = self._strip_required(event_type)
        source_module = self._strip_required(source_module)
        task_event = self.repository.create_event(
            ispdn_id=ispdn_id,
            event_type=event_type,
            source_module=source_module,
            title=event_title,
            description=self._normalize_optional_text(description),
            organization_id=organization_id,
            automation_key=automation_key,
        )
        responsible_employee_id = self._get_ispdn_responsible_employee_id(ispdn_id, organization_id)
        for task_payload in tasks or []:
            self._ensure_task_payload_is_valid(task_payload, organization_id)
            self.repository.create_task(
                task_event,
                task_payload.model_copy(update={"responsible_employee_id": responsible_employee_id}),
            )
        return self.get_event(task_event.id, organization_id)

    def create_task(self, task_event_id: int, payload: TaskCreate, organization_id: int) -> Task:
        task_event = self.get_event(task_event_id, organization_id)
        self._ensure_task_payload_is_valid(payload, organization_id)
        return self.repository.create_task(task_event, payload)

    def update_task(self, task_event_id: int, task_id: int, payload: TaskUpdate, organization_id: int) -> Task:
        self.get_event(task_event_id, organization_id)
        self._ensure_task_payload_is_valid(payload, organization_id)
        task = self.repository.get_task_in_event(task_event_id, task_id)
        if task is None:
            raise TaskNotFoundError
        return self.repository.update_task(task, payload)

    def update_task_status(self, task_event_id: int, task_id: int, status: TaskStatus, organization_id: int) -> Task:
        self.get_event(task_event_id, organization_id)
        task = self.repository.get_task_in_event(task_event_id, task_id)
        if task is None:
            raise TaskNotFoundError
        return self.repository.update_task_status(task, status)

    def update_task_importance(
        self,
        task_event_id: int,
        task_id: int,
        importance: TaskImportance | None,
        organization_id: int,
    ) -> Task:
        self.get_event(task_event_id, organization_id)
        task = self.repository.get_task_in_event(task_event_id, task_id)
        if task is None:
            raise TaskNotFoundError
        return self.repository.update_task_importance(task, importance)

    def delete_task(self, task_event_id: int, task_id: int, organization_id: int) -> None:
        self.get_event(task_event_id, organization_id)
        task = self.repository.get_task_in_event(task_event_id, task_id)
        if task is None:
            raise TaskNotFoundError
        self.repository.delete_task(task)

    def list_actual_tasks_for_ispdn(self, ispdn_id: int, organization_id: int) -> list[ActualTaskRead]:
        self._ensure_ispdn_exists(ispdn_id, organization_id)
        return [self._to_actual_task_read(task) for task in self.repository.list_actual_tasks_for_ispdn(ispdn_id, organization_id)]

    def create_ispdn_created_event(self, ispdn_id: int, ispdn_name: str, organization_id: int) -> TaskEvent:
        self._ensure_ispdn_exists(ispdn_id, organization_id)
        responsible_employee_id = self._get_ispdn_responsible_employee_id(ispdn_id, organization_id)
        task_event = self.repository.create_event_once(
            ispdn_id=ispdn_id,
            event_type="ispdn_created",
            source_module="ispdn_registry",
            title="Создание новой ИСПДн",
            description="Создана новая ИСПДн, для которой необходимо завершить первичное заполнение контрольных данных.",
            automation_key=f"ispdn_created:{ispdn_id}",
            organization_id=organization_id,
        )
        self.repository.create_task_once(
            task_event_id=task_event.id,
            title='Заполнение модуля "Технические меры защиты"',
            description=(
                "Вам необходимо указать фактический статус всех мер технической защиты для ИСПДн и заполнить "
                "комментарий, если фактический статус не совпадает с статусом по приказу ФСТЭК №21"
            ),
            importance="high",
            status="pending",
            automation_key="fill_technical_security_measures",
            responsible_employee_id=responsible_employee_id,
        )
        return self.get_event(task_event.id, organization_id)

    def _ensure_task_payload_is_valid(self, payload: TaskCreate | TaskUpdate, organization_id: int | None) -> None:
        self._strip_required(payload.title)
        if payload.responsible_employee_id is not None:
            self._ensure_employee_exists(payload.responsible_employee_id, organization_id)

    def _ensure_ispdn_exists(self, ispdn_id: int, organization_id: int | None) -> None:
        if organization_id is None or self.ispdn_repository.get_by_id(ispdn_id, organization_id) is None:
            raise TaskEventIspdnNotFoundError

    def _get_ispdn_responsible_employee_id(self, ispdn_id: int, organization_id: int | None) -> int | None:
        if organization_id is None:
            raise TaskEventIspdnNotFoundError
        ispdn = self.ispdn_repository.get_by_id(ispdn_id, organization_id)
        if ispdn is None:
            raise TaskEventIspdnNotFoundError
        return ispdn.responsible_employee_id

    def _ensure_employee_exists(self, employee_id: int, organization_id: int | None) -> None:
        if organization_id is None or self.employee_repository.get_by_id(employee_id, organization_id) is None:
            raise TaskResponsibleEmployeeNotFoundError

    @staticmethod
    def _strip_required(value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Required text field must not be empty")
        return stripped

    @staticmethod
    def _normalize_optional_text(value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None

    @staticmethod
    def _to_actual_task_read(task: Task) -> ActualTaskRead:
        if task.task_event.ispdn_id is None or task.task_event.ispdn is None:
            raise TaskEventIspdnNotFoundError
        return ActualTaskRead(
            id=task.id,
            task_event_id=task.task_event_id,
            task_event_title=task.task_event.title,
            ispdn_id=task.task_event.ispdn_id,
            ispdn_name=task.task_event.ispdn.name,
            automation_key=task.automation_key,
            title=task.title,
            description=task.description,
            importance=task.importance,
            deadline=task.deadline,
            responsible_employee_id=task.responsible_employee_id,
            responsible_employee=task.responsible_employee,
            status=task.status,
            created_at=task.created_at,
            updated_at=task.updated_at,
        )
