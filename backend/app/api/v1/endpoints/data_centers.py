from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.repositories.data_center import DataCenterRepository
from app.repositories.ispdn import IspdnRepository
from app.repositories.processing_process import ProcessingProcessRepository
from app.repositories.security_level import SecurityLevelRepository
from app.repositories.security_measure import SecurityMeasureRepository
from app.repositories.task_event import TaskEventRepository
from app.schemas.data_center import (
    DataCenterCreate,
    DataCenterListItem,
    DataCenterOption,
    DataCenterRead,
    DataCenterUpdate,
    IspdnDataCentersUpdate,
)
from app.services.data_center import (
    DataCenterInUseError,
    DataCenterIspdnNotFoundError,
    DataCenterLinkedItemNotFoundError,
    DataCenterNotFoundError,
    DataCenterService,
)
from app.services.task_automation import TaskAutomationService

router = APIRouter(tags=["data-centers"])


def get_data_center_service(db: Session = Depends(get_db)) -> DataCenterService:
    ispdn_repository = IspdnRepository(db)
    return DataCenterService(
        DataCenterRepository(db),
        TaskAutomationService(
            TaskEventRepository(db),
            ispdn_repository,
            ProcessingProcessRepository(db),
            SecurityLevelRepository(db),
            SecurityMeasureRepository(db),
        ),
    )


@router.get("/data-centers", response_model=list[DataCenterListItem])
def list_data_centers(
    service: DataCenterService = Depends(get_data_center_service),
    current_user: User = Depends(get_current_user),
):
    return service.list_data_centers(current_user.organization_id)


@router.post("/data-centers", response_model=DataCenterRead, status_code=status.HTTP_201_CREATED)
def create_data_center(
    payload: DataCenterCreate,
    service: DataCenterService = Depends(get_data_center_service),
    current_user: User = Depends(get_current_user),
):
    return service.create_data_center(payload, current_user.organization_id)


@router.get("/data-centers/options", response_model=list[DataCenterOption])
def list_data_center_options(
    service: DataCenterService = Depends(get_data_center_service),
    current_user: User = Depends(get_current_user),
):
    return service.list_options(current_user.organization_id)


@router.get("/data-centers/{data_center_id}", response_model=DataCenterRead)
def get_data_center(
    data_center_id: int,
    service: DataCenterService = Depends(get_data_center_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.get_data_center(data_center_id, current_user.organization_id)
    except DataCenterNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data center not found") from exc


@router.put("/data-centers/{data_center_id}", response_model=DataCenterRead)
def update_data_center(
    data_center_id: int,
    payload: DataCenterUpdate,
    service: DataCenterService = Depends(get_data_center_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.update_data_center(data_center_id, payload, current_user.organization_id)
    except DataCenterNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data center not found") from exc


@router.delete("/data-centers/{data_center_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_data_center(
    data_center_id: int,
    service: DataCenterService = Depends(get_data_center_service),
    current_user: User = Depends(get_current_user),
):
    try:
        service.delete_data_center(data_center_id, current_user.organization_id)
    except DataCenterNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data center not found") from exc
    except DataCenterInUseError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Data center is linked to one or more Ispdn cards and cannot be deleted",
        ) from exc


@router.get("/ispdns/{ispdn_id}/data-centers", response_model=list[DataCenterOption])
def list_ispdn_data_centers(
    ispdn_id: int,
    service: DataCenterService = Depends(get_data_center_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.list_for_ispdn(ispdn_id, current_user.organization_id)
    except DataCenterIspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc


@router.put("/ispdns/{ispdn_id}/data-centers", response_model=list[DataCenterOption])
def update_ispdn_data_centers(
    ispdn_id: int,
    payload: IspdnDataCentersUpdate,
    service: DataCenterService = Depends(get_data_center_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.set_for_ispdn(ispdn_id, payload, current_user.organization_id)
    except DataCenterIspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc
    except DataCenterLinkedItemNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or more data centers not found") from exc
