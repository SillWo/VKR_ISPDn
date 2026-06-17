from io import BytesIO
from urllib.parse import quote
from zipfile import ZIP_DEFLATED, ZipFile

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
from app.document_generation.core.filenames import build_content_disposition, sanitize_filename_part
from app.document_generation.core.service import DocumentGenerationService, GeneratedDocument
from app.repositories.ispdn import IspdnRepository
from app.schemas.documents import DocumentBatchGenerateRequest, DocumentGenerateRequest, DocumentTypeRead
from app.services.ispdn import IspdnNotFoundError

router = APIRouter(tags=["documents"])

ZIP_MEDIA_TYPE = "application/zip"


def build_document_response(generated_document: GeneratedDocument) -> StreamingResponse:
    headers = {
        "Content-Disposition": build_content_disposition(generated_document.filename),
    }
    return StreamingResponse(
        generated_document.file,
        media_type=generated_document.media_type,
        headers=headers,
    )


def build_zip_content_disposition(filename: str) -> str:
    safe_filename = sanitize_filename_part(_remove_zip_extension(filename), fallback="documents")
    zip_filename = f"{safe_filename}.zip"
    encoded_filename = quote(zip_filename)
    ascii_fallback = zip_filename.encode("ascii", "ignore").decode("ascii").strip().strip(" .")
    if not ascii_fallback or ascii_fallback.lower() == "zip":
        ascii_fallback = "documents.zip"
    elif not ascii_fallback.lower().endswith(".zip"):
        ascii_fallback = f"{ascii_fallback}.zip"
    return f"attachment; filename=\"{ascii_fallback}\"; filename*=UTF-8''{encoded_filename}"


def _remove_zip_extension(value: str) -> str:
    return value[: -len(".zip")] if value.lower().endswith(".zip") else value


def _document_generation_http_exception(exc: Exception) -> HTTPException:
    if isinstance(exc, DocumentTypeNotFoundError):
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document type not found")
    if isinstance(exc, IspdnNotFoundError):
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found")
    if isinstance(exc, DocumentEmployeeNotFoundError):
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    if isinstance(exc, DocumentControlEventNotFoundError):
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Control event not found")
    if isinstance(exc, DocumentPrerequisiteMissingError):
        return HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    if isinstance(exc, DocumentRequiresIspdnError):
        return HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    if isinstance(exc, ValidationError):
        return HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=jsonable_encoder(exc.errors()),
        )
    if isinstance(exc, DocumentTemplateNotFoundError):
        return HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="System DOCX template is missing. Check backend document_generation templates.",
        )
    if isinstance(exc, DocumentRenderError):
        return HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to render DOCX template.",
        )
    return HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to generate document.")


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
    except (
        DocumentTypeNotFoundError,
        IspdnNotFoundError,
        DocumentEmployeeNotFoundError,
        DocumentControlEventNotFoundError,
        DocumentPrerequisiteMissingError,
        DocumentRequiresIspdnError,
        ValidationError,
        DocumentTemplateNotFoundError,
        DocumentRenderError,
    ) as exc:
        raise _document_generation_http_exception(exc) from exc

    return build_document_response(generated_document)


@router.post("/ispdns/{ispdn_id}/documents/generate-zip")
def generate_ispdn_documents_zip(
    ispdn_id: int,
    payload: DocumentBatchGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StreamingResponse:
    ispdn_card = IspdnRepository(db).get_by_id(ispdn_id, current_user.organization_id)
    if ispdn_card is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found")

    service = DocumentGenerationService(db)
    generated_documents: list[GeneratedDocument] = []
    generated_document_types: list[str] = []
    try:
        for document_request in payload.documents:
            generated_document = service.generate(
                document_type=document_request.document_type,
                ispdn_id=ispdn_id,
                manual_data=document_request.manual_data,
                organization_id=current_user.organization_id,
            )
            generated_documents.append(generated_document)
            generated_document_types.append(document_request.document_type)
    except (
        DocumentTypeNotFoundError,
        IspdnNotFoundError,
        DocumentEmployeeNotFoundError,
        DocumentControlEventNotFoundError,
        DocumentPrerequisiteMissingError,
        DocumentRequiresIspdnError,
        ValidationError,
        DocumentTemplateNotFoundError,
        DocumentRenderError,
    ) as exc:
        http_exception = _document_generation_http_exception(exc)
        failed_document_type = payload.documents[len(generated_documents)].document_type
        raise HTTPException(
            status_code=http_exception.status_code,
            detail={
                "document_type": failed_document_type,
                "generated_document_types": generated_document_types,
                "message": http_exception.detail,
            },
        ) from exc

    zip_file = BytesIO()
    with ZipFile(zip_file, mode="w", compression=ZIP_DEFLATED) as archive:
        for generated_document in generated_documents:
            generated_document.file.seek(0)
            archive.writestr(generated_document.filename, generated_document.file.read())
    zip_file.seek(0)

    archive_filename = f"Документы ИСПДн - {ispdn_card.name}.zip"
    return StreamingResponse(
        zip_file,
        media_type=ZIP_MEDIA_TYPE,
        headers={"Content-Disposition": build_zip_content_disposition(archive_filename)},
    )


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
    except (
        DocumentTypeNotFoundError,
        DocumentEmployeeNotFoundError,
        DocumentControlEventNotFoundError,
        DocumentPrerequisiteMissingError,
        DocumentRequiresIspdnError,
        ValidationError,
        DocumentTemplateNotFoundError,
        DocumentRenderError,
    ) as exc:
        raise _document_generation_http_exception(exc) from exc

    return build_document_response(generated_document)
