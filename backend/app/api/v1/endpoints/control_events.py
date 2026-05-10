from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.control_event import ControlEventRepository
from app.schemas.control_event import (
    ControlEventCreate,
    ControlEventFileRead,
    ControlEventOption,
    ControlEventRead,
    ControlEventUpdate,
)
from app.services.control_event import (
    ControlEventFileNotFoundError,
    ControlEventFileValidationError,
    ControlEventNameConflictError,
    ControlEventNotFoundError,
    ControlEventService,
)

router = APIRouter(prefix="/control-events", tags=["control-events"])


def get_control_event_service(db: Session = Depends(get_db)) -> ControlEventService:
    return ControlEventService(ControlEventRepository(db))


@router.get("", response_model=list[ControlEventRead])
def list_control_events(service: ControlEventService = Depends(get_control_event_service)):
    return service.list_control_events()


@router.post("", response_model=ControlEventRead, status_code=status.HTTP_201_CREATED)
def create_control_event(
    payload: ControlEventCreate,
    service: ControlEventService = Depends(get_control_event_service),
):
    try:
        return service.create_control_event(payload)
    except ControlEventNameConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Control event name already exists") from exc


@router.get("/options", response_model=list[ControlEventOption])
def list_control_event_options(service: ControlEventService = Depends(get_control_event_service)):
    return service.list_options()


@router.get("/{control_event_id}", response_model=ControlEventRead)
def get_control_event(
    control_event_id: int,
    service: ControlEventService = Depends(get_control_event_service),
):
    try:
        return service.get_control_event(control_event_id)
    except ControlEventNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Control event not found") from exc


@router.put("/{control_event_id}", response_model=ControlEventRead)
def update_control_event(
    control_event_id: int,
    payload: ControlEventUpdate,
    service: ControlEventService = Depends(get_control_event_service),
):
    try:
        return service.update_control_event(control_event_id, payload)
    except ControlEventNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Control event not found") from exc
    except ControlEventNameConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Control event name already exists") from exc


@router.delete("/{control_event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_control_event(
    control_event_id: int,
    service: ControlEventService = Depends(get_control_event_service),
):
    try:
        service.delete_control_event(control_event_id)
    except ControlEventNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Control event not found") from exc


@router.get("/{control_event_id}/files", response_model=list[ControlEventFileRead])
def list_control_event_files(
    control_event_id: int,
    service: ControlEventService = Depends(get_control_event_service),
):
    try:
        return service.get_control_event(control_event_id).files
    except ControlEventNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Control event not found") from exc


@router.post("/{control_event_id}/files", response_model=ControlEventFileRead, status_code=status.HTTP_201_CREATED)
def upload_control_event_file(
    control_event_id: int,
    control_event_file: UploadFile = File(...),
    service: ControlEventService = Depends(get_control_event_service),
):
    try:
        return service.upload_file(control_event_id, control_event_file)
    except ControlEventNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Control event not found") from exc
    except (ControlEventFileValidationError, ValidationError) as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Only .pdf, .docx and .xlsx files are allowed",
        ) from exc


@router.get("/{control_event_id}/files/{file_id}")
def download_control_event_file(
    control_event_id: int,
    file_id: int,
    service: ControlEventService = Depends(get_control_event_service),
):
    try:
        file_path, file_name, media_type = service.get_file(control_event_id, file_id)
        return FileResponse(path=file_path, filename=file_name, media_type=media_type)
    except (ControlEventNotFoundError, ControlEventFileNotFoundError) as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Control event file not found") from exc


@router.delete("/{control_event_id}/files/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_control_event_file(
    control_event_id: int,
    file_id: int,
    service: ControlEventService = Depends(get_control_event_service),
):
    try:
        service.delete_file(control_event_id, file_id)
    except (ControlEventNotFoundError, ControlEventFileNotFoundError) as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Control event file not found") from exc
