from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.repositories.ispdn import IspdnRepository
from app.repositories.processing_process import ProcessingProcessRepository
from app.repositories.security_level import SecurityLevelRepository
from app.repositories.security_measure import SecurityMeasureRepository
from app.repositories.task_event import TaskEventRepository
from app.schemas.security_measure import (
    IspdnSecurityToolsRead,
    IspdnSecurityToolsUpsert,
    TechnicalSecurityMeasureDocumentRead,
    TechnicalSecurityMeasureRead,
    TechnicalSecurityMeasureUpdate,
    TechnicalSecurityMeasuresTableRead,
)
from app.services.security_measure import (
    SecurityMeasureDocumentNotFoundError,
    SecurityMeasureNotFoundError,
    SecurityMeasuresIspdnNotFoundError,
    SecurityMeasuresSecurityLevelRequiredError,
    SecurityMeasureService,
    SecurityMeasureValidationError,
)
from app.services.task_automation import TaskAutomationService

router = APIRouter(prefix="/ispdns/{ispdn_id}", tags=["security-measures"])


def get_security_measure_service(db: Session = Depends(get_db)) -> SecurityMeasureService:
    ispdn_repository = IspdnRepository(db)
    security_level_repository = SecurityLevelRepository(db)
    security_measure_repository = SecurityMeasureRepository(db)
    return SecurityMeasureService(
        security_measure_repository,
        ispdn_repository,
        security_level_repository,
        TaskAutomationService(
            TaskEventRepository(db),
            ispdn_repository,
            ProcessingProcessRepository(db),
            security_level_repository,
            security_measure_repository,
        ),
    )


@router.get("/security-tools", response_model=IspdnSecurityToolsRead)
def get_security_tools(
    ispdn_id: int,
    service: SecurityMeasureService = Depends(get_security_measure_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.get_security_tools(ispdn_id, current_user.organization_id)
    except SecurityMeasuresIspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc


@router.put("/security-tools", response_model=IspdnSecurityToolsRead)
def upsert_security_tools(
    ispdn_id: int,
    payload: IspdnSecurityToolsUpsert,
    service: SecurityMeasureService = Depends(get_security_measure_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.upsert_security_tools(ispdn_id, payload, current_user.organization_id)
    except SecurityMeasuresIspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc


@router.get("/security-measures", response_model=TechnicalSecurityMeasuresTableRead)
def get_security_measures(
    ispdn_id: int,
    service: SecurityMeasureService = Depends(get_security_measure_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.get_table(ispdn_id, current_user.organization_id)
    except SecurityMeasuresIspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc
    except SecurityMeasuresSecurityLevelRequiredError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Security level data is required before security measures calculation",
        ) from exc


@router.put("/security-measures/{measure_code}", response_model=TechnicalSecurityMeasureRead)
def update_security_measure(
    ispdn_id: int,
    measure_code: str,
    payload: TechnicalSecurityMeasureUpdate,
    service: SecurityMeasureService = Depends(get_security_measure_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.update_measure(ispdn_id, measure_code, payload, current_user.organization_id)
    except SecurityMeasuresIspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc
    except SecurityMeasureNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Security measure not found") from exc
    except SecurityMeasuresSecurityLevelRequiredError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Security level data is required before security measures calculation",
        ) from exc
    except (SecurityMeasureValidationError, ValidationError) as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc


@router.get("/security-measures/document-context")
def get_security_measures_document_context(
    ispdn_id: int,
    service: SecurityMeasureService = Depends(get_security_measure_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.get_document_context(ispdn_id, current_user.organization_id)
    except SecurityMeasuresIspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc


@router.get("/security-measures/documents", response_model=list[TechnicalSecurityMeasureDocumentRead])
def get_security_measure_documents(
    ispdn_id: int,
    service: SecurityMeasureService = Depends(get_security_measure_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.list_documents(ispdn_id, current_user.organization_id)
    except SecurityMeasuresIspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc


@router.post(
    "/security-measures/documents",
    response_model=TechnicalSecurityMeasureDocumentRead,
    status_code=status.HTTP_201_CREATED,
)
def upload_security_measure_document(
    ispdn_id: int,
    document_file: UploadFile = File(...),
    service: SecurityMeasureService = Depends(get_security_measure_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.upload_document(ispdn_id, document_file, current_user.organization_id)
    except SecurityMeasuresIspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc
    except (SecurityMeasureValidationError, ValidationError) as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc


@router.get("/security-measures/documents/{document_id}/file")
def get_security_measure_document_file(
    ispdn_id: int,
    document_id: int,
    service: SecurityMeasureService = Depends(get_security_measure_service),
    current_user: User = Depends(get_current_user),
):
    try:
        file_path, file_name, media_type = service.get_document_file(ispdn_id, document_id, current_user.organization_id)
        return FileResponse(path=file_path, filename=file_name, media_type=media_type)
    except (SecurityMeasuresIspdnNotFoundError, SecurityMeasureDocumentNotFoundError) as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Technical security measure document not found",
        ) from exc


@router.delete("/security-measures/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_security_measure_document(
    ispdn_id: int,
    document_id: int,
    service: SecurityMeasureService = Depends(get_security_measure_service),
    current_user: User = Depends(get_current_user),
):
    try:
        service.delete_document(ispdn_id, document_id, current_user.organization_id)
    except (SecurityMeasuresIspdnNotFoundError, SecurityMeasureDocumentNotFoundError) as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Technical security measure document not found",
        ) from exc
