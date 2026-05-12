from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.employee import EmployeeShortRead
from app.schemas.text import strip_required_text

TaskImportance = Literal["low", "medium", "high", "critical"]
TaskStatus = Literal["pending", "in_progress", "done"]


class IspdnTaskShortRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    importance: TaskImportance | None = None
    deadline: date | None = None
    responsible_employee_id: int | None = None
    status: TaskStatus = "pending"

    _validate_title = field_validator("title", mode="before")(strip_required_text)

    @field_validator("description", mode="before")
    @classmethod
    def normalize_description(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if isinstance(value, str) and not value.strip():
            return None
        return value.strip() if isinstance(value, str) else value


class TaskUpdate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    importance: TaskImportance | None = None
    deadline: date | None = None
    responsible_employee_id: int | None = None
    status: TaskStatus

    _validate_title = field_validator("title", mode="before")(strip_required_text)

    @field_validator("description", mode="before")
    @classmethod
    def normalize_description(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if isinstance(value, str) and not value.strip():
            return None
        return value.strip() if isinstance(value, str) else value


class TaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_event_id: int
    automation_key: str | None
    title: str
    description: str | None
    importance: TaskImportance | None
    deadline: date | None
    responsible_employee_id: int | None
    responsible_employee: EmployeeShortRead | None = None
    status: TaskStatus
    created_at: datetime
    updated_at: datetime


class TaskEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ispdn_id: int
    ispdn: IspdnTaskShortRead
    event_type: str
    source_module: str
    automation_key: str | None
    title: str
    description: str | None
    tasks: list[TaskRead]
    created_at: datetime
    updated_at: datetime


class TaskEventListItem(TaskEventRead):
    pass


class ActualTaskRead(BaseModel):
    id: int
    task_event_id: int
    task_event_title: str
    ispdn_id: int
    ispdn_name: str
    automation_key: str | None
    title: str
    description: str | None
    importance: TaskImportance | None
    deadline: date | None
    responsible_employee_id: int | None
    responsible_employee: EmployeeShortRead | None = None
    status: TaskStatus
    created_at: datetime
    updated_at: datetime
