import json

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.domain.security_level_algorithm import SecurityLevelCalculationError
from app.repositories.ispdn import IspdnRepository
from app.repositories.processing_process import ProcessingProcessRepository
from app.repositories.security_level import SecurityLevelRepository
from app.repositories.security_measure import SecurityMeasureRepository
from app.repositories.task_event import TaskEventRepository
from app.schemas.security_level import (
    SecurityLevelBase,
    SecurityLevelCalculationResult,
    SecurityLevelDocumentContext,
    SecurityLevelRead,
    SecurityLevelUpsert,
)
from app.services.ispdn import IspdnNotFoundError
from app.services.security_level import (
    SecurityLevelFileNotFoundError,
    SecurityLevelNotFoundError,
    SecurityLevelService,
    SecurityLevelValidationError,
)
from app.services.task_automation import TaskAutomationService

router = APIRouter(prefix="/ispdns/{ispdn_id}/security-level", tags=["security-level"])


def get_security_level_service(db: Session = Depends(get_db)) -> SecurityLevelService:
    ispdn_repository = IspdnRepository(db)
    security_level_repository = SecurityLevelRepository(db)
    return SecurityLevelService(
        security_level_repository,
        ispdn_repository,
        TaskAutomationService(
            TaskEventRepository(db),
            ispdn_repository,
            ProcessingProcessRepository(db),
            security_level_repository,
            SecurityMeasureRepository(db),
        ),
    )


@router.get("", response_model=SecurityLevelRead)
def get_security_level(
    ispdn_id: int,
    service: SecurityLevelService = Depends(get_security_level_service),
):
    try:
        return service.get_record(ispdn_id)
    except IspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc
    except SecurityLevelNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Security level data is not filled yet",
        ) from exc


@router.put("", response_model=SecurityLevelRead)
def upsert_security_level(
    ispdn_id: int,
    data_categories: str = Form(...),
    subject_count_range: str = Form(...),
    threat_type: str = Form(...),
    subject_group: str = Form(...),
    actual_level: int = Form(...),
    deviation_justification_text: str | None = Form(None),
    deviation_justification_file: UploadFile | None = File(None),
    service: SecurityLevelService = Depends(get_security_level_service),
):
    try:
        payload = _parse_multipart_payload(
            data_categories=data_categories,
            subject_count_range=subject_count_range,
            threat_type=threat_type,
            subject_group=subject_group,
            actual_level=actual_level,
            deviation_justification_text=deviation_justification_text,
        )
        return service.upsert_record(ispdn_id, payload, deviation_justification_file)
    except IspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc
    except (SecurityLevelValidationError, ValueError, ValidationError) as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except SecurityLevelCalculationError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc


@router.post("/calculate", response_model=SecurityLevelCalculationResult)
def calculate_security_level(
    ispdn_id: int,
    payload: SecurityLevelBase,
    service: SecurityLevelService = Depends(get_security_level_service),
):
    try:
        return service.calculate(ispdn_id, payload)
    except IspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except SecurityLevelCalculationError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc


@router.get("/document-context", response_model=SecurityLevelDocumentContext)
def get_security_level_document_context(
    ispdn_id: int,
    service: SecurityLevelService = Depends(get_security_level_service),
):
    try:
        return service.get_document_context(ispdn_id)
    except IspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc
    except SecurityLevelNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Security level data is not filled yet",
        ) from exc


@router.get("/justification-file")
def get_security_level_justification_file(
    ispdn_id: int,
    service: SecurityLevelService = Depends(get_security_level_service),
):
    try:
        file_path, file_name, media_type = service.get_justification_file(ispdn_id)
        return FileResponse(path=file_path, filename=file_name, media_type=media_type)
    except IspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc
    except (SecurityLevelNotFoundError, SecurityLevelFileNotFoundError) as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Justification file not found") from exc


def _parse_multipart_payload(
    *,
    data_categories: str,
    subject_count_range: str,
    threat_type: str,
    subject_group: str,
    actual_level: int,
    deviation_justification_text: str | None,
) -> SecurityLevelUpsert:
    try:
        parsed_data_categories = json.loads(data_categories)
    except json.JSONDecodeError as exc:
        raise ValueError("data_categories must be a valid JSON object") from exc

    return SecurityLevelUpsert(
        data_categories=parsed_data_categories,
        subject_count_range=subject_count_range,
        threat_type=threat_type,
        subject_group=subject_group,
        actual_level=actual_level,
        deviation_justification_text=deviation_justification_text,
    )
