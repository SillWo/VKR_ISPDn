from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.organization import OrganizationRepository
from app.schemas.organization import OrganizationRead, OrganizationUpsert
from app.services.organization import OrganizationNotFoundError, OrganizationService

router = APIRouter(prefix="/organization", tags=["organization"])


def get_organization_service(db: Session = Depends(get_db)) -> OrganizationService:
    return OrganizationService(OrganizationRepository(db))


@router.get("", response_model=OrganizationRead)
def get_organization(service: OrganizationService = Depends(get_organization_service)):
    try:
        return service.get_card()
    except OrganizationNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization card is not created yet",
        ) from exc


@router.put("", response_model=OrganizationRead)
def upsert_organization(
    payload: OrganizationUpsert,
    service: OrganizationService = Depends(get_organization_service),
):
    return service.upsert_card(payload)
