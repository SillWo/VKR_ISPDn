from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.processing_purpose import ProcessingPurposeRepository
from app.schemas.processing_purpose import (
    ProcessingPurposeCreate,
    ProcessingPurposeOption,
    ProcessingPurposeRead,
    ProcessingPurposeUpdate,
)
from app.services.processing_purpose import (
    ProcessingPurposeInUseError,
    ProcessingPurposeNameConflictError,
    ProcessingPurposeNotFoundError,
    ProcessingPurposeService,
)

router = APIRouter(prefix="/processing-purposes", tags=["processing-purposes"])


def get_processing_purpose_service(db: Session = Depends(get_db)) -> ProcessingPurposeService:
    return ProcessingPurposeService(ProcessingPurposeRepository(db))


@router.get("", response_model=list[ProcessingPurposeRead])
def list_processing_purposes(service: ProcessingPurposeService = Depends(get_processing_purpose_service)):
    return service.list_purposes()


@router.post("", response_model=ProcessingPurposeRead, status_code=status.HTTP_201_CREATED)
def create_processing_purpose(
    payload: ProcessingPurposeCreate,
    service: ProcessingPurposeService = Depends(get_processing_purpose_service),
):
    try:
        return service.create_purpose(payload)
    except ProcessingPurposeNameConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Processing purpose name already exists") from exc


@router.get("/options", response_model=list[ProcessingPurposeOption])
def list_processing_purpose_options(service: ProcessingPurposeService = Depends(get_processing_purpose_service)):
    return service.list_options()


@router.get("/{purpose_id}", response_model=ProcessingPurposeRead)
def get_processing_purpose(
    purpose_id: int,
    service: ProcessingPurposeService = Depends(get_processing_purpose_service),
):
    try:
        return service.get_purpose(purpose_id)
    except ProcessingPurposeNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Processing purpose not found") from exc


@router.put("/{purpose_id}", response_model=ProcessingPurposeRead)
def update_processing_purpose(
    purpose_id: int,
    payload: ProcessingPurposeUpdate,
    service: ProcessingPurposeService = Depends(get_processing_purpose_service),
):
    try:
        return service.update_purpose(purpose_id, payload)
    except ProcessingPurposeNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Processing purpose not found") from exc
    except ProcessingPurposeNameConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Processing purpose name already exists") from exc


@router.delete("/{purpose_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_processing_purpose(
    purpose_id: int,
    service: ProcessingPurposeService = Depends(get_processing_purpose_service),
):
    try:
        service.delete_purpose(purpose_id)
    except ProcessingPurposeNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Processing purpose not found") from exc
    except ProcessingPurposeInUseError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Processing purpose is used by processing processes and cannot be deleted",
        ) from exc
