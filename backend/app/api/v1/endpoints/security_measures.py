from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.ispdn import IspdnRepository
from app.repositories.security_level import SecurityLevelRepository
from app.repositories.security_measure import SecurityMeasureRepository
from app.schemas.security_measure import (
    IspdnSecurityToolsRead,
    IspdnSecurityToolsUpsert,
    TechnicalSecurityMeasureRead,
    TechnicalSecurityMeasureUpdate,
    TechnicalSecurityMeasuresTableRead,
)
from app.services.security_measure import (
    SecurityMeasureFileNotFoundError,
    SecurityMeasureNotFoundError,
    SecurityMeasuresIspdnNotFoundError,
    SecurityMeasuresSecurityLevelRequiredError,
    SecurityMeasureService,
    SecurityMeasureValidationError,
)

router = APIRouter(prefix="/ispdns/{ispdn_id}", tags=["security-measures"])


def get_security_measure_service(db: Session = Depends(get_db)) -> SecurityMeasureService:
    return SecurityMeasureService(SecurityMeasureRepository(db), IspdnRepository(db), SecurityLevelRepository(db))


@router.get("/security-tools", response_model=IspdnSecurityToolsRead)
def get_security_tools(
    ispdn_id: int,
    service: SecurityMeasureService = Depends(get_security_measure_service),
):
    try:
        return service.get_security_tools(ispdn_id)
    except SecurityMeasuresIspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc


@router.put("/security-tools", response_model=IspdnSecurityToolsRead)
def upsert_security_tools(
    ispdn_id: int,
    payload: IspdnSecurityToolsUpsert,
    service: SecurityMeasureService = Depends(get_security_measure_service),
):
    try:
        return service.upsert_security_tools(ispdn_id, payload)
    except SecurityMeasuresIspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc


@router.get("/security-measures", response_model=TechnicalSecurityMeasuresTableRead)
def get_security_measures(
    ispdn_id: int,
    service: SecurityMeasureService = Depends(get_security_measure_service),
):
    try:
        return service.get_table(ispdn_id)
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
    factual_status: str = Form(...),
    justification_text: str | None = Form(None),
    justification_file: UploadFile | None = File(None),
    service: SecurityMeasureService = Depends(get_security_measure_service),
):
    try:
        payload = TechnicalSecurityMeasureUpdate(
            factual_status=factual_status,
            justification_text=justification_text,
        )
        return service.update_measure(ispdn_id, measure_code, payload, justification_file)
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


@router.get("/security-measures/{measure_code}/justification-file")
def get_security_measure_justification_file(
    ispdn_id: int,
    measure_code: str,
    service: SecurityMeasureService = Depends(get_security_measure_service),
):
    try:
        file_path, file_name, media_type = service.get_justification_file(ispdn_id, measure_code)
        return FileResponse(path=file_path, filename=file_name, media_type=media_type)
    except (SecurityMeasuresIspdnNotFoundError, SecurityMeasureNotFoundError, SecurityMeasureFileNotFoundError) as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Justification file not found") from exc


@router.get("/security-measures/document-context")
def get_security_measures_document_context(
    ispdn_id: int,
    service: SecurityMeasureService = Depends(get_security_measure_service),
):
    try:
        return service.get_document_context(ispdn_id)
    except SecurityMeasuresIspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc
