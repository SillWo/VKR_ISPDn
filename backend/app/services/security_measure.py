from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.domain.fstek21_measures import FSTEK21_MEASURES, get_measure_by_code, get_measure_regulatory_status
from app.models.security_measure import IspdnSecurityTools, TechnicalSecurityMeasureRecord
from app.repositories.ispdn import IspdnRepository
from app.repositories.security_level import SecurityLevelRepository
from app.repositories.security_measure import SecurityMeasureRepository
from app.schemas.security_measure import (
    IspdnSecurityToolsRead,
    IspdnSecurityToolsUpsert,
    TechnicalSecurityMeasureDocumentRead,
    TechnicalSecurityMeasureRead,
    TechnicalSecurityMeasureUpdate,
    TechnicalSecurityMeasuresSummary,
    TechnicalSecurityMeasuresTableRead,
)

TECHNICAL_SECURITY_MEASURE_DOCUMENT_STORAGE_DIR = (
    Path(__file__).resolve().parents[2] / "storage" / "technical_security_measure_documents"
)
ALLOWED_DOCUMENT_EXTENSIONS = {".pdf", ".docx"}
ALLOWED_DOCUMENT_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
REGULATORY_STATUS_LABELS = {"base_set": "базовый набор", "not_base_set": "не базовый набор"}
FACTUAL_STATUS_LABELS = {"implemented": "внедрена", "not_implemented": "не внедрена"}


class SecurityMeasuresIspdnNotFoundError(Exception):
    pass


class SecurityMeasuresSecurityLevelRequiredError(Exception):
    pass


class SecurityMeasureNotFoundError(Exception):
    pass


class SecurityMeasureValidationError(Exception):
    pass


class SecurityMeasureDocumentNotFoundError(Exception):
    pass


class SecurityMeasureService:
    def __init__(
        self,
        repository: SecurityMeasureRepository,
        ispdn_repository: IspdnRepository,
        security_level_repository: SecurityLevelRepository,
    ) -> None:
        self.repository = repository
        self.ispdn_repository = ispdn_repository
        self.security_level_repository = security_level_repository

    def get_security_tools(self, ispdn_id: int) -> IspdnSecurityToolsRead:
        self._ensure_ispdn_exists(ispdn_id)
        record = self.repository.get_security_tools(ispdn_id)
        if record is None:
            return IspdnSecurityToolsRead()
        return IspdnSecurityToolsRead.model_validate(record)

    def upsert_security_tools(self, ispdn_id: int, payload: IspdnSecurityToolsUpsert) -> IspdnSecurityTools:
        self._ensure_ispdn_exists(ispdn_id)
        values = {"ispdn_id": ispdn_id, **payload.model_dump()}
        existing_record = self.repository.get_security_tools(ispdn_id)
        if existing_record is None:
            return self.repository.create_security_tools(values)
        return self.repository.update_security_tools(existing_record, values)

    def get_table(self, ispdn_id: int) -> TechnicalSecurityMeasuresTableRead:
        self._ensure_ispdn_exists(ispdn_id)
        security_level = self.security_level_repository.get_by_ispdn(ispdn_id)
        if security_level is None:
            raise SecurityMeasuresSecurityLevelRequiredError

        records_by_code = {record.measure_code: record for record in self.repository.get_measure_records(ispdn_id)}
        measure_security_level = security_level.actual_level
        items = [
            self._build_measure_read(measure, records_by_code.get(measure["code"]), measure_security_level)
            for measure in FSTEK21_MEASURES
        ]
        return TechnicalSecurityMeasuresTableRead(
            ispdn_id=ispdn_id,
            recommended_level=security_level.recommended_level,
            actual_level=security_level.actual_level,
            actual_level_matches_recommended=security_level.actual_level_matches_recommended,
            items=items,
            summary=self._build_summary(items),
        )

    def update_measure(
        self,
        ispdn_id: int,
        measure_code: str,
        payload: TechnicalSecurityMeasureUpdate,
    ) -> TechnicalSecurityMeasureRead:
        self._ensure_ispdn_exists(ispdn_id)
        measure = get_measure_by_code(measure_code)
        if measure is None:
            raise SecurityMeasureNotFoundError

        security_level = self.security_level_repository.get_by_ispdn(ispdn_id)
        if security_level is None:
            raise SecurityMeasuresSecurityLevelRequiredError

        regulatory_status = get_measure_regulatory_status(measure_code, security_level.actual_level)
        comment_required = self._is_comment_required(regulatory_status, payload.factual_status)
        if comment_required and not payload.comment:
            raise SecurityMeasureValidationError("Comment is required for this measure status")

        values = {
            "ispdn_id": ispdn_id,
            "measure_code": measure_code,
            "factual_status": payload.factual_status,
            "comment": payload.comment,
        }
        existing_record = self.repository.get_measure_record(ispdn_id, measure_code)
        if existing_record is None:
            record = self.repository.create_measure_record(values)
        else:
            record = self.repository.update_measure_record(existing_record, values)

        return self._build_measure_read(measure, record, security_level.actual_level)

    def list_documents(self, ispdn_id: int) -> list[TechnicalSecurityMeasureDocumentRead]:
        self._ensure_ispdn_exists(ispdn_id)
        return [TechnicalSecurityMeasureDocumentRead.model_validate(document) for document in self.repository.get_documents(ispdn_id)]

    def upload_document(self, ispdn_id: int, upload: UploadFile) -> TechnicalSecurityMeasureDocumentRead:
        self._ensure_ispdn_exists(ispdn_id)
        file_metadata = self._save_document_file(upload)
        document = self.repository.create_document({"ispdn_id": ispdn_id, **file_metadata})
        return TechnicalSecurityMeasureDocumentRead.model_validate(document)

    def get_document_file(self, ispdn_id: int, document_id: int) -> tuple[Path, str, str]:
        self._ensure_ispdn_exists(ispdn_id)
        document = self.repository.get_document(ispdn_id, document_id)
        if document is None:
            raise SecurityMeasureDocumentNotFoundError

        file_path = Path(document.file_path)
        if not self._is_inside_document_storage(file_path) or not file_path.exists() or not file_path.is_file():
            raise SecurityMeasureDocumentNotFoundError
        return file_path, document.file_name, document.file_content_type

    def delete_document(self, ispdn_id: int, document_id: int) -> None:
        self._ensure_ispdn_exists(ispdn_id)
        document = self.repository.get_document(ispdn_id, document_id)
        if document is None:
            raise SecurityMeasureDocumentNotFoundError

        file_path = Path(document.file_path)
        self.repository.delete_document(document)
        self._delete_document_file(file_path)

    def get_document_context(self, ispdn_id: int) -> dict:
        tools = self.get_security_tools(ispdn_id).model_dump()
        try:
            table = self.get_table(ispdn_id)
        except SecurityMeasuresSecurityLevelRequiredError:
            return {
                "security_tools": tools,
                "security_measures": [],
                "security_measures_summary": {"security_level_required": True},
                "base_set_security_measures": [],
                "not_base_set_security_measures": [],
                "implemented_security_measures": [],
                "not_implemented_security_measures": [],
                "security_measures_with_missing_required_comment": [],
                "technical_security_measure_documents": [],
            }

        measures = [
            {
                "code": item.code,
                "section_code": item.section_code,
                "section_title": item.section_title,
                "content": item.content,
                "regulatory_status": item.regulatory_status,
                "regulatory_status_label": item.regulatory_status_label,
                "factual_status": item.factual_status,
                "factual_status_label": item.factual_status_label,
                "comment_required": item.comment_required,
                "comment": item.comment,
                "has_comment": item.has_comment,
                "justification_required": item.comment_required,
                "justification_text": item.comment,
            }
            for item in table.items
        ]
        documents = [
            {
                "id": document.id,
                "file_name": document.file_name,
                "file_content_type": document.file_content_type,
                "file_size_bytes": document.file_size_bytes,
                "created_at": document.created_at,
            }
            for document in self.repository.get_documents(ispdn_id)
        ]
        return {
            "security_tools": tools,
            "security_measures": measures,
            "security_measures_summary": table.summary.model_dump() | {"security_level_required": False},
            "base_set_security_measures": [item for item in measures if item["regulatory_status"] == "base_set"],
            "not_base_set_security_measures": [item for item in measures if item["regulatory_status"] == "not_base_set"],
            "implemented_security_measures": [item for item in measures if item["factual_status"] == "implemented"],
            "not_implemented_security_measures": [item for item in measures if item["factual_status"] == "not_implemented"],
            "security_measures_with_missing_required_comment": [
                item for item in measures if item["comment_required"] and not item["has_comment"]
            ],
            "technical_security_measure_documents": documents,
        }

    def _ensure_ispdn_exists(self, ispdn_id: int) -> None:
        if self.ispdn_repository.get_by_id(ispdn_id) is None:
            raise SecurityMeasuresIspdnNotFoundError

    def _build_measure_read(
        self,
        measure: dict,
        record: TechnicalSecurityMeasureRecord | None,
        security_level: int,
    ) -> TechnicalSecurityMeasureRead:
        regulatory_status = get_measure_regulatory_status(measure["code"], security_level)
        factual_status = record.factual_status if record else "not_implemented"
        comment = record.comment if record else None
        has_comment = bool(comment and comment.strip())
        comment_required = self._is_comment_required(regulatory_status, factual_status)
        return TechnicalSecurityMeasureRead(
            code=measure["code"],
            section_code=measure["section_code"],
            section_title=measure["section_title"],
            content=measure["content"],
            security_level=security_level,
            regulatory_status=regulatory_status,
            regulatory_status_label=REGULATORY_STATUS_LABELS[regulatory_status],
            factual_status=factual_status,
            factual_status_label=FACTUAL_STATUS_LABELS[factual_status],
            comment_required=comment_required,
            comment=comment,
            has_comment=has_comment,
            updated_at=record.updated_at if record else None,
        )

    @staticmethod
    def _is_comment_required(regulatory_status: str, factual_status: str) -> bool:
        return (regulatory_status == "base_set" and factual_status == "not_implemented") or (
            regulatory_status == "not_base_set" and factual_status == "implemented"
        )

    @staticmethod
    def _build_summary(items: list[TechnicalSecurityMeasureRead]) -> TechnicalSecurityMeasuresSummary:
        base_set_implemented_count = sum(
            1 for item in items if item.regulatory_status == "base_set" and item.factual_status == "implemented"
        )
        base_set_rejected_count = sum(
            1
            for item in items
            if item.regulatory_status == "base_set" and item.factual_status == "not_implemented" and item.has_comment
        )
        base_set_not_implemented_count = sum(
            1
            for item in items
            if item.regulatory_status == "base_set" and item.factual_status == "not_implemented" and not item.has_comment
        )
        comment_required_count = sum(1 for item in items if item.comment_required)
        total_count = len(items)
        return TechnicalSecurityMeasuresSummary(
            total_count=total_count,
            base_set_count=sum(1 for item in items if item.regulatory_status == "base_set"),
            not_base_set_count=sum(1 for item in items if item.regulatory_status == "not_base_set"),
            implemented_count=sum(1 for item in items if item.factual_status == "implemented"),
            not_implemented_count=sum(1 for item in items if item.factual_status == "not_implemented"),
            base_set_implemented_count=base_set_implemented_count,
            base_set_not_implemented_count=base_set_not_implemented_count,
            base_set_rejected_count=base_set_rejected_count,
            comment_required_count=comment_required_count,
            comment_not_required_count=total_count - comment_required_count,
            missing_required_comment_count=sum(1 for item in items if item.comment_required and not item.has_comment),
        )

    def _save_document_file(self, upload: UploadFile) -> dict[str, str | int]:
        original_name = Path(upload.filename or "").name
        extension = Path(original_name).suffix.lower()
        if extension not in ALLOWED_DOCUMENT_EXTENSIONS:
            raise SecurityMeasureValidationError("Only .pdf and .docx technical security measure documents are allowed")

        content_type = upload.content_type or ""
        if content_type not in ALLOWED_DOCUMENT_MIME_TYPES:
            raise SecurityMeasureValidationError("Technical security measure document MIME type is not allowed")

        TECHNICAL_SECURITY_MEASURE_DOCUMENT_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
        storage_name = f"{uuid4().hex}{extension}"
        storage_path = TECHNICAL_SECURITY_MEASURE_DOCUMENT_STORAGE_DIR / storage_name
        file_size = 0
        upload.file.seek(0)
        with storage_path.open("wb") as target:
            while chunk := upload.file.read(1024 * 1024):
                file_size += len(chunk)
                target.write(chunk)

        return {
            "file_path": str(storage_path),
            "file_name": original_name,
            "file_content_type": content_type,
            "file_size_bytes": file_size,
        }

    @staticmethod
    def _is_inside_document_storage(file_path: Path) -> bool:
        try:
            file_path.resolve().relative_to(TECHNICAL_SECURITY_MEASURE_DOCUMENT_STORAGE_DIR.resolve())
        except ValueError:
            return False
        return True

    def _delete_document_file(self, file_path: Path) -> None:
        if not self._is_inside_document_storage(file_path):
            return
        if file_path.exists() and file_path.is_file():
            file_path.unlink()
