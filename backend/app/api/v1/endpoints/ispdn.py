from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.employee import EmployeeRepository
from app.repositories.ispdn import IspdnRepository
from app.schemas.ispdn import IspdnCreate, IspdnListItem, IspdnRead, IspdnUpdate
from app.services.ispdn import IspdnNotFoundError, IspdnResponsibleEmployeeNotFoundError, IspdnService

router = APIRouter(prefix="/ispdns", tags=["ispdns"])


def get_ispdn_service(db: Session = Depends(get_db)) -> IspdnService:
    return IspdnService(IspdnRepository(db), EmployeeRepository(db))


@router.get("", response_model=list[IspdnListItem])
def list_ispdns(service: IspdnService = Depends(get_ispdn_service)):
    return service.list_cards()


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
