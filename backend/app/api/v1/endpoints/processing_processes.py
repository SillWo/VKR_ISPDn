from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.ispdn import IspdnRepository
from app.repositories.processing_process import ProcessingProcessRepository
from app.repositories.processing_purpose import ProcessingPurposeRepository
from app.schemas.processing_process import (
    ProcessingProcessCreate,
    ProcessingProcessDocumentContext,
    ProcessingProcessListItem,
    ProcessingProcessRead,
    ProcessingProcessUpdate,
)
from app.services.ispdn import IspdnNotFoundError
from app.services.processing_process import ProcessingProcessNotFoundError, ProcessingProcessService
from app.services.processing_purpose import ProcessingPurposeNotFoundError

router = APIRouter(prefix="/ispdns/{ispdn_id}/processing-processes", tags=["processing-processes"])


def get_processing_process_service(db: Session = Depends(get_db)) -> ProcessingProcessService:
    return ProcessingProcessService(
        ProcessingProcessRepository(db),
        IspdnRepository(db),
        ProcessingPurposeRepository(db),
    )


@router.get("", response_model=list[ProcessingProcessListItem])
def list_processing_processes(
    ispdn_id: int,
    service: ProcessingProcessService = Depends(get_processing_process_service),
):
    try:
        return service.list_processes(ispdn_id)
    except IspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc


@router.post("", response_model=ProcessingProcessRead, status_code=status.HTTP_201_CREATED)
def create_processing_process(
    ispdn_id: int,
    payload: ProcessingProcessCreate,
    service: ProcessingProcessService = Depends(get_processing_process_service),
):
    try:
        return service.create_process(ispdn_id, payload)
    except IspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc
    except ProcessingPurposeNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Processing purpose not found") from exc


@router.get("/document-context", response_model=ProcessingProcessDocumentContext)
def get_processing_process_document_context(
    ispdn_id: int,
    service: ProcessingProcessService = Depends(get_processing_process_service),
):
    try:
        return service.get_document_context(ispdn_id)
    except IspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc


@router.get("/{process_id}", response_model=ProcessingProcessRead)
def get_processing_process(
    ispdn_id: int,
    process_id: int,
    service: ProcessingProcessService = Depends(get_processing_process_service),
):
    try:
        return service.get_process(ispdn_id, process_id)
    except IspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc
    except ProcessingProcessNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Processing process not found") from exc


@router.put("/{process_id}", response_model=ProcessingProcessRead)
def update_processing_process(
    ispdn_id: int,
    process_id: int,
    payload: ProcessingProcessUpdate,
    service: ProcessingProcessService = Depends(get_processing_process_service),
):
    try:
        return service.update_process(ispdn_id, process_id, payload)
    except IspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc
    except ProcessingProcessNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Processing process not found") from exc
    except ProcessingPurposeNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Processing purpose not found") from exc


@router.delete("/{process_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_processing_process(
    ispdn_id: int,
    process_id: int,
    service: ProcessingProcessService = Depends(get_processing_process_service),
):
    try:
        service.delete_process(ispdn_id, process_id)
    except IspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc
    except ProcessingProcessNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Processing process not found") from exc
