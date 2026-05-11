from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.employee import EmployeeRepository
from app.repositories.ispdn import IspdnRepository
from app.repositories.task_event import TaskEventRepository
from app.schemas.ispdn import IspdnCreate, IspdnListItem, IspdnRead, IspdnStatus, IspdnUpdate
from app.services.ispdn import (
    IspdnNotFoundError,
    IspdnResponsibleEmployeeNotFoundError,
    IspdnService,
)
from app.services.task_event import TaskEventService

router = APIRouter(prefix="/ispdns", tags=["ispdns"])


def get_ispdn_service(db: Session = Depends(get_db)) -> IspdnService:
    ispdn_repository = IspdnRepository(db)
    employee_repository = EmployeeRepository(db)
    task_event_service = TaskEventService(TaskEventRepository(db), ispdn_repository, employee_repository)
    return IspdnService(
        ispdn_repository,
        employee_repository,
        task_event_service,
    )


@router.get("", response_model=list[IspdnListItem])
def list_ispdns(status: IspdnStatus | None = None, service: IspdnService = Depends(get_ispdn_service)):
    return service.list_cards(status)


@router.post("", response_model=IspdnRead, status_code=status.HTTP_201_CREATED)
def create_ispdn(payload: IspdnCreate, service: IspdnService = Depends(get_ispdn_service)):
    try:
        return service.create_card(payload)
    except IspdnResponsibleEmployeeNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Responsible employee not found") from exc


@router.get("/{ispdn_id}", response_model=IspdnRead)
def get_ispdn(ispdn_id: int, service: IspdnService = Depends(get_ispdn_service)):
    try:
        return service.get_card(ispdn_id)
    except IspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc


@router.put("/{ispdn_id}", response_model=IspdnRead)
def update_ispdn(ispdn_id: int, payload: IspdnUpdate, service: IspdnService = Depends(get_ispdn_service)):
    try:
        return service.update_card(ispdn_id, payload)
    except IspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc
    except IspdnResponsibleEmployeeNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Responsible employee not found") from exc


@router.delete("/{ispdn_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ispdn(ispdn_id: int, service: IspdnService = Depends(get_ispdn_service)):
    try:
        service.delete_card(ispdn_id)
    except IspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc
