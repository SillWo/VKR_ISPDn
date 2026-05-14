from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.repositories.employee import EmployeeRepository
from app.repositories.ispdn import IspdnRepository
from app.repositories.task_event import TaskEventRepository
from app.schemas.task_event import (
    ActualTaskRead,
    TaskCreate,
    TaskEventCreate,
    TaskEventListItem,
    TaskEventRead,
    TaskImportance,
    TaskImportancePatch,
    TaskRead,
    TaskStatus,
    TaskStatusPatch,
    TaskUpdate,
)
from app.services.task_event import (
    TaskEventIspdnArchivedError,
    TaskEventIspdnNotFoundError,
    TaskEventNotFoundError,
    TaskEventService,
    TaskNotFoundError,
    TaskResponsibleEmployeeNotFoundError,
)

router = APIRouter(tags=["task-events"])


def get_task_event_service(db: Session = Depends(get_db)) -> TaskEventService:
    return TaskEventService(TaskEventRepository(db), IspdnRepository(db), EmployeeRepository(db))


@router.get("/task-events", response_model=list[TaskEventListItem])
def list_task_events(
    ispdn_id: int | None = None,
    task_status: TaskStatus | None = None,
    importance: TaskImportance | None = None,
    responsible_employee_id: int | None = None,
    actual_only: bool = Query(default=False),
    service: TaskEventService = Depends(get_task_event_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.list_events(
            ispdn_id=ispdn_id,
            task_status=task_status,
            importance=importance,
            responsible_employee_id=responsible_employee_id,
            actual_only=actual_only,
            organization_id=current_user.organization_id,
        )
    except TaskEventIspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc
    except TaskResponsibleEmployeeNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Responsible employee not found") from exc


@router.post("/task-events", response_model=TaskEventRead, status_code=status.HTTP_201_CREATED)
def create_task_event(
    payload: TaskEventCreate,
    service: TaskEventService = Depends(get_task_event_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.create_manual_event(payload, current_user.organization_id)
    except TaskEventIspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc
    except TaskEventIspdnArchivedError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Task event can be created only for active Ispdn card",
        ) from exc


@router.get("/task-events/{task_event_id}", response_model=TaskEventRead)
def get_task_event(
    task_event_id: int,
    service: TaskEventService = Depends(get_task_event_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.get_event(task_event_id, current_user.organization_id)
    except TaskEventNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task event not found") from exc


@router.post("/task-events/{task_event_id}/tasks", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def create_task(
    task_event_id: int,
    payload: TaskCreate,
    service: TaskEventService = Depends(get_task_event_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.create_task(task_event_id, payload, current_user.organization_id)
    except TaskEventNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task event not found") from exc
    except TaskResponsibleEmployeeNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Responsible employee not found") from exc


@router.put("/task-events/{task_event_id}/tasks/{task_id}", response_model=TaskRead)
def update_task(
    task_event_id: int,
    task_id: int,
    payload: TaskUpdate,
    service: TaskEventService = Depends(get_task_event_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.update_task(task_event_id, task_id, payload, current_user.organization_id)
    except TaskEventNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task event not found") from exc
    except TaskNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found in task event") from exc
    except TaskResponsibleEmployeeNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Responsible employee not found") from exc


@router.patch("/task-events/{task_event_id}/tasks/{task_id}/status", response_model=TaskRead)
def update_task_status(
    task_event_id: int,
    task_id: int,
    payload: TaskStatusPatch,
    service: TaskEventService = Depends(get_task_event_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.update_task_status(task_event_id, task_id, payload.status, current_user.organization_id)
    except TaskEventNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task event not found") from exc
    except TaskNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found in task event") from exc


@router.patch("/task-events/{task_event_id}/tasks/{task_id}/importance", response_model=TaskRead)
def update_task_importance(
    task_event_id: int,
    task_id: int,
    payload: TaskImportancePatch,
    service: TaskEventService = Depends(get_task_event_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.update_task_importance(task_event_id, task_id, payload.importance, current_user.organization_id)
    except TaskEventNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task event not found") from exc
    except TaskNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found in task event") from exc


@router.delete("/task-events/{task_event_id}/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_event_id: int,
    task_id: int,
    service: TaskEventService = Depends(get_task_event_service),
    current_user: User = Depends(get_current_user),
):
    try:
        service.delete_task(task_event_id, task_id, current_user.organization_id)
    except TaskEventNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task event not found") from exc
    except TaskNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found in task event") from exc


@router.get("/ispdns/{ispdn_id}/tasks/actual", response_model=list[ActualTaskRead])
def list_actual_tasks_for_ispdn(
    ispdn_id: int,
    service: TaskEventService = Depends(get_task_event_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.list_actual_tasks_for_ispdn(ispdn_id, current_user.organization_id)
    except TaskEventIspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc
