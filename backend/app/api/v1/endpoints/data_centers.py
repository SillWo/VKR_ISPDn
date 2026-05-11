from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.data_center import DataCenterRepository
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

router = APIRouter(tags=["data-centers"])


def get_data_center_service(db: Session = Depends(get_db)) -> DataCenterService:
    return DataCenterService(DataCenterRepository(db))


@router.get("/data-centers", response_model=list[DataCenterListItem])
def list_data_centers(service: DataCenterService = Depends(get_data_center_service)):
    return service.list_data_centers()


@router.post("/data-centers", response_model=DataCenterRead, status_code=status.HTTP_201_CREATED)
def create_data_center(
    payload: DataCenterCreate,
    service: DataCenterService = Depends(get_data_center_service),
):
    return service.create_data_center(payload)


@router.get("/data-centers/options", response_model=list[DataCenterOption])
def list_data_center_options(service: DataCenterService = Depends(get_data_center_service)):
    return service.list_options()


@router.get("/data-centers/{data_center_id}", response_model=DataCenterRead)
def get_data_center(
    data_center_id: int,
    service: DataCenterService = Depends(get_data_center_service),
):
    try:
        return service.get_data_center(data_center_id)
    except DataCenterNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data center not found") from exc


@router.put("/data-centers/{data_center_id}", response_model=DataCenterRead)
def update_data_center(
    data_center_id: int,
    payload: DataCenterUpdate,
    service: DataCenterService = Depends(get_data_center_service),
):
    try:
        return service.update_data_center(data_center_id, payload)
    except DataCenterNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data center not found") from exc


@router.delete("/data-centers/{data_center_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_data_center(
    data_center_id: int,
    service: DataCenterService = Depends(get_data_center_service),
):
    try:
        service.delete_data_center(data_center_id)
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
):
    try:
        return service.list_for_ispdn(ispdn_id)
    except DataCenterIspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc


@router.put("/ispdns/{ispdn_id}/data-centers", response_model=list[DataCenterOption])
def update_ispdn_data_centers(
    ispdn_id: int,
    payload: IspdnDataCentersUpdate,
    service: DataCenterService = Depends(get_data_center_service),
):
    try:
        return service.set_for_ispdn(ispdn_id, payload)
    except DataCenterIspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc
    except DataCenterLinkedItemNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or more data centers not found") from exc
