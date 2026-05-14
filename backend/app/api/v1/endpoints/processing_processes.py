from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.repositories.ispdn import IspdnRepository
from app.repositories.processing_process import ProcessingProcessRepository
from app.repositories.security_level import SecurityLevelRepository
from app.repositories.security_measure import SecurityMeasureRepository
from app.repositories.task_event import TaskEventRepository
from app.schemas.processing_process import (
    IspdnProcessingProcessLinkCreate,
    ProcessingProcessCreate,
    ProcessingProcessDocumentContext,
    ProcessingProcessListItem,
    ProcessingProcessOption,
    ProcessingProcessRead,
    ProcessingProcessRegistryItem,
    ProcessingProcessUpdate,
)
from app.services.ispdn import IspdnNotFoundError
from app.services.processing_process import (
    ProcessingProcessInUseError,
    ProcessingProcessLinkedItemNotFoundError,
    ProcessingProcessNotFoundError,
    ProcessingProcessService,
)
from app.services.task_automation import TaskAutomationService

router = APIRouter(tags=["processing-processes"])


def get_processing_process_service(db: Session = Depends(get_db)) -> ProcessingProcessService:
    ispdn_repository = IspdnRepository(db)
    processing_process_repository = ProcessingProcessRepository(db)
    return ProcessingProcessService(
        processing_process_repository,
        ispdn_repository,
        TaskAutomationService(
            TaskEventRepository(db),
            ispdn_repository,
            processing_process_repository,
            SecurityLevelRepository(db),
            SecurityMeasureRepository(db),
        ),
    )


@router.get("/processing-processes", response_model=list[ProcessingProcessRegistryItem])
def list_processing_processes(
    service: ProcessingProcessService = Depends(get_processing_process_service),
    current_user: User = Depends(get_current_user),
):
    return service.list_registry(current_user.organization_id)


@router.post("/processing-processes", response_model=ProcessingProcessRead, status_code=status.HTTP_201_CREATED)
def create_processing_process(
    payload: ProcessingProcessCreate,
    service: ProcessingProcessService = Depends(get_processing_process_service),
    current_user: User = Depends(get_current_user),
):
    return service.create_registry_process(payload, current_user.organization_id)


@router.get("/processing-processes/options", response_model=list[ProcessingProcessOption])
def list_processing_process_options(
    service: ProcessingProcessService = Depends(get_processing_process_service),
    current_user: User = Depends(get_current_user),
):
    return service.list_options(current_user.organization_id)


@router.get("/processing-processes/active-unique", response_model=list[ProcessingProcessListItem])
def list_unique_active_processing_processes(
    service: ProcessingProcessService = Depends(get_processing_process_service),
    current_user: User = Depends(get_current_user),
):
    return service.list_unique_for_active_ispdns(current_user.organization_id)


@router.get("/processing-processes/{process_id}", response_model=ProcessingProcessRead)
def get_processing_process(
    process_id: int,
    service: ProcessingProcessService = Depends(get_processing_process_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.get_registry_process(process_id, current_user.organization_id)
    except ProcessingProcessNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Processing process not found") from exc


@router.put("/processing-processes/{process_id}", response_model=ProcessingProcessRead)
def update_processing_process(
    process_id: int,
    payload: ProcessingProcessUpdate,
    service: ProcessingProcessService = Depends(get_processing_process_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.update_registry_process(process_id, payload, current_user.organization_id)
    except ProcessingProcessNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Processing process not found") from exc
    except ProcessingProcessInUseError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Processing process is linked to Ispdn cards and cannot be edited in registry",
        ) from exc


@router.delete("/processing-processes/{process_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_processing_process(
    process_id: int,
    service: ProcessingProcessService = Depends(get_processing_process_service),
    current_user: User = Depends(get_current_user),
):
    try:
        service.delete_registry_process(process_id, current_user.organization_id)
    except ProcessingProcessNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Processing process not found") from exc
    except ProcessingProcessInUseError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Processing process is linked to Ispdn cards and cannot be deleted",
        ) from exc


@router.get("/ispdns/{ispdn_id}/processing-processes", response_model=list[ProcessingProcessListItem])
def list_ispdn_processing_processes(
    ispdn_id: int,
    service: ProcessingProcessService = Depends(get_processing_process_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.list_processes_for_ispdn(ispdn_id, current_user.organization_id)
    except IspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc


@router.post(
    "/ispdns/{ispdn_id}/processing-processes",
    response_model=ProcessingProcessRead,
    status_code=status.HTTP_201_CREATED,
)
def create_ispdn_processing_process(
    ispdn_id: int,
    payload: ProcessingProcessCreate,
    service: ProcessingProcessService = Depends(get_processing_process_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.create_and_link_process_to_ispdn(ispdn_id, payload, current_user.organization_id)
    except IspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc


@router.post("/ispdns/{ispdn_id}/processing-processes/link", response_model=ProcessingProcessRead)
def link_ispdn_processing_process(
    ispdn_id: int,
    payload: IspdnProcessingProcessLinkCreate,
    service: ProcessingProcessService = Depends(get_processing_process_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.link_existing_process_to_ispdn(ispdn_id, payload, current_user.organization_id)
    except IspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc
    except ProcessingProcessNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Processing process not found") from exc


@router.put("/ispdns/{ispdn_id}/processing-processes/{process_id}", response_model=ProcessingProcessRead)
def update_ispdn_processing_process(
    ispdn_id: int,
    process_id: int,
    payload: ProcessingProcessUpdate,
    service: ProcessingProcessService = Depends(get_processing_process_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.update_process_for_ispdn(ispdn_id, process_id, payload, current_user.organization_id)
    except IspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc
    except (ProcessingProcessNotFoundError, ProcessingProcessLinkedItemNotFoundError) as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Processing process not found") from exc


@router.delete("/ispdns/{ispdn_id}/processing-processes/{process_id}", status_code=status.HTTP_204_NO_CONTENT)
def unlink_ispdn_processing_process(
    ispdn_id: int,
    process_id: int,
    service: ProcessingProcessService = Depends(get_processing_process_service),
    current_user: User = Depends(get_current_user),
):
    try:
        service.unlink_process_from_ispdn(ispdn_id, process_id, current_user.organization_id)
    except IspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc
    except (ProcessingProcessNotFoundError, ProcessingProcessLinkedItemNotFoundError) as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Processing process not found") from exc


@router.get("/ispdns/{ispdn_id}/processing-processes/document-context", response_model=ProcessingProcessDocumentContext)
def get_processing_process_document_context(
    ispdn_id: int,
    service: ProcessingProcessService = Depends(get_processing_process_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.get_document_context(ispdn_id, current_user.organization_id)
    except IspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc
