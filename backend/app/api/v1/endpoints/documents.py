from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.encoders import jsonable_encoder
from fastapi.responses import StreamingResponse
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.document_generation.core.errors import (
    DocumentControlEventNotFoundError,
    DocumentEmployeeNotFoundError,
    DocumentPrerequisiteMissingError,
    DocumentRenderError,
    DocumentRequiresIspdnError,
    DocumentTemplateNotFoundError,
    DocumentTypeNotFoundError,
)
from app.document_generation.core.registry import get_document_registry
from app.document_generation.core.service import DocumentGenerationService
from app.schemas.documents import DocumentGenerateRequest, DocumentTypeRead
from app.services.ispdn import IspdnNotFoundError

router = APIRouter(tags=["documents"])


@router.get("/document-types", response_model=list[DocumentTypeRead])
def list_document_types(_current_user: User = Depends(get_current_user)) -> list[DocumentTypeRead]:
    registry = get_document_registry()
    return [
        DocumentTypeRead(
            code=generator.code,
            title=generator.title,
            description=generator.description,
            requires_ispdn=generator.requires_ispdn,
            manual_fields=generator.get_manual_fields(),
        )
        for generator in registry.list_generators()
    ]


@router.post("/ispdns/{ispdn_id}/documents/generate")
def generate_ispdn_document(
    ispdn_id: int,
    payload: DocumentGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StreamingResponse:
    service = DocumentGenerationService(db)
    try:
        generated_document = service.generate(
            document_type=payload.document_type,
            ispdn_id=ispdn_id,
            manual_data=payload.manual_data,
            organization_id=current_user.organization_id,
        )
    except DocumentTypeNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document type not found") from exc
    except IspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc
    except DocumentEmployeeNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found") from exc
    except DocumentControlEventNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Control event not found") from exc
    except DocumentPrerequisiteMissingError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except (DocumentRequiresIspdnError, ValidationError) as exc:
        detail = jsonable_encoder(exc.errors()) if isinstance(exc, ValidationError) else str(exc)
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail) from exc
    except DocumentTemplateNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="System DOCX template is missing. Check backend document_generation templates.",
        ) from exc
    except DocumentRenderError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to render DOCX template.",
        ) from exc

    encoded_filename = quote(generated_document.filename)
    headers = {
        "Content-Disposition": f"attachment; filename=\"document.docx\"; filename*=UTF-8''{encoded_filename}",
    }
    return StreamingResponse(generated_document.file, media_type=generated_document.media_type, headers=headers)


@router.post("/documents/generate")
def generate_global_document(
    payload: DocumentGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StreamingResponse:
    service = DocumentGenerationService(db)
    try:
        generated_document = service.generate(
            document_type=payload.document_type,
            ispdn_id=None,
            manual_data=payload.manual_data,
            organization_id=current_user.organization_id,
        )
    except DocumentTypeNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document type not found") from exc
    except DocumentEmployeeNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found") from exc
    except DocumentControlEventNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Control event not found") from exc
    except DocumentPrerequisiteMissingError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except (DocumentRequiresIspdnError, ValidationError) as exc:
        detail = jsonable_encoder(exc.errors()) if isinstance(exc, ValidationError) else str(exc)
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail) from exc
    except DocumentTemplateNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="System DOCX template is missing. Check backend document_generation templates.",
        ) from exc
    except DocumentRenderError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to render DOCX template.",
        ) from exc

    encoded_filename = quote(generated_document.filename)
    headers = {
        "Content-Disposition": f"attachment; filename=\"document.docx\"; filename*=UTF-8''{encoded_filename}",
    }
    return StreamingResponse(generated_document.file, media_type=generated_document.media_type, headers=headers)
