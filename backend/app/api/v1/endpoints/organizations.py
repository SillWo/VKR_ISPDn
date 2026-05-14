from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.repositories.ispdn import IspdnRepository
from app.repositories.organization import OrganizationRepository
from app.repositories.processing_process import ProcessingProcessRepository
from app.repositories.security_level import SecurityLevelRepository
from app.repositories.security_measure import SecurityMeasureRepository
from app.repositories.task_event import TaskEventRepository
from app.schemas.organization import OrganizationRead, OrganizationUpsert
from app.services.organization import (
    OrganizationEmployeeNotFoundError,
    OrganizationNotFoundError,
    OrganizationService,
)
from app.services.task_automation import TaskAutomationService

router = APIRouter(prefix="/organization", tags=["organization"])


def get_organization_service(db: Session = Depends(get_db)) -> OrganizationService:
    ispdn_repository = IspdnRepository(db)
    return OrganizationService(
        OrganizationRepository(db),
        TaskAutomationService(
            TaskEventRepository(db),
            ispdn_repository,
            ProcessingProcessRepository(db),
            SecurityLevelRepository(db),
            SecurityMeasureRepository(db),
        ),
    )


@router.get("", response_model=OrganizationRead)
def get_organization(
    service: OrganizationService = Depends(get_organization_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.get_card(current_user.organization_id)
    except OrganizationNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization card is not created yet",
        ) from exc


@router.put("", response_model=OrganizationRead)
def upsert_organization(
    payload: OrganizationUpsert,
    service: OrganizationService = Depends(get_organization_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.upsert_card(payload, current_user.organization_id)
    except OrganizationEmployeeNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found") from exc
