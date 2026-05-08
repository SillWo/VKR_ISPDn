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
    TechnicalSecurityMeasureRead,
    TechnicalSecurityMeasureUpdate,
    TechnicalSecurityMeasuresSummary,
    TechnicalSecurityMeasuresTableRead,
)

TECHNICAL_SECURITY_MEASURE_JUSTIFICATION_STORAGE_DIR = (
    Path(__file__).resolve().parents[2] / "storage" / "technical_security_measure_justifications"
)
ALLOWED_JUSTIFICATION_EXTENSIONS = {".pdf", ".docx"}
ALLOWED_JUSTIFICATION_MIME_TYPES = {
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


class SecurityMeasureFileNotFoundError(Exception):
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
        justification_file: UploadFile | None = None,
    ) -> TechnicalSecurityMeasureRead:
        self._ensure_ispdn_exists(ispdn_id)
        measure = get_measure_by_code(measure_code)
        if measure is None:
            raise SecurityMeasureNotFoundError

        security_level = self.security_level_repository.get_by_ispdn(ispdn_id)
        if security_level is None:
            raise SecurityMeasuresSecurityLevelRequiredError

        existing_record = self.repository.get_measure_record(ispdn_id, measure_code)
        file_metadata = self._build_existing_file_metadata(existing_record)
        if justification_file is not None:
            file_metadata = self._save_justification_file(justification_file)

        justification_required = self._is_justification_required(
            get_measure_regulatory_status(measure_code, security_level.actual_level),
            payload.factual_status,
        )
        if (
            justification_required
            and not payload.justification_text
            and not file_metadata.get("justification_file_path")
        ):
            raise SecurityMeasureValidationError("Justification is required for this measure status")

        values = {
            "ispdn_id": ispdn_id,
            "measure_code": measure_code,
            "factual_status": payload.factual_status,
            "justification_text": payload.justification_text,
            **file_metadata,
        }
        if existing_record is None:
            record = self.repository.create_measure_record(values)
        else:
            old_file_path = existing_record.justification_file_path
            record = self.repository.update_measure_record(existing_record, values)
            if justification_file is not None and old_file_path != record.justification_file_path:
                self._delete_existing_file(old_file_path)

        return self._build_measure_read(measure, record, security_level.actual_level)

    def get_justification_file(self, ispdn_id: int, measure_code: str) -> tuple[Path, str, str]:
        self._ensure_ispdn_exists(ispdn_id)
        if get_measure_by_code(measure_code) is None:
            raise SecurityMeasureNotFoundError
        record = self.repository.get_measure_record(ispdn_id, measure_code)
        if record is None or not record.justification_file_path:
            raise SecurityMeasureFileNotFoundError
        file_path = Path(record.justification_file_path)
        if not file_path.exists() or not file_path.is_file():
            raise SecurityMeasureFileNotFoundError
        return (
            file_path,
            record.justification_file_name or file_path.name,
            record.justification_file_content_type or "application/octet-stream",
        )

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
                "security_measures_with_missing_required_justification": [],
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
                "justification_required": item.justification_required,
                "justification_text": item.justification_text,
                "justification_file_name": item.justification_file_name,
            }
            for item in table.items
        ]
        return {
            "security_tools": tools,
            "security_measures": measures,
            "security_measures_summary": table.summary.model_dump() | {"security_level_required": False},
            "base_set_security_measures": [item for item in measures if item["regulatory_status"] == "base_set"],
            "not_base_set_security_measures": [item for item in measures if item["regulatory_status"] == "not_base_set"],
            "implemented_security_measures": [item for item in measures if item["factual_status"] == "implemented"],
            "not_implemented_security_measures": [item for item in measures if item["factual_status"] == "not_implemented"],
            "security_measures_with_missing_required_justification": [
                item
                for item in measures
                if item["justification_required"] and not item["justification_text"] and not item["justification_file_name"]
            ],
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
        justification_required = self._is_justification_required(regulatory_status, factual_status)
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
            justification_required=justification_required,
            justification_text=record.justification_text if record else None,
            justification_file_name=record.justification_file_name if record else None,
            has_justification_file=bool(record and record.justification_file_path),
            updated_at=record.updated_at if record else None,
        )

    @staticmethod
    def _is_justification_required(regulatory_status: str, factual_status: str) -> bool:
        return (regulatory_status == "base_set" and factual_status == "not_implemented") or (
            regulatory_status == "not_base_set" and factual_status == "implemented"
        )

    @staticmethod
    def _build_summary(items: list[TechnicalSecurityMeasureRead]) -> TechnicalSecurityMeasuresSummary:
        return TechnicalSecurityMeasuresSummary(
            total_count=len(items),
            base_set_count=sum(1 for item in items if item.regulatory_status == "base_set"),
            not_base_set_count=sum(1 for item in items if item.regulatory_status == "not_base_set"),
            implemented_count=sum(1 for item in items if item.factual_status == "implemented"),
            not_implemented_count=sum(1 for item in items if item.factual_status == "not_implemented"),
            justification_required_count=sum(1 for item in items if item.justification_required),
            missing_required_justification_count=sum(
                1
                for item in items
                if item.justification_required and not item.justification_text and not item.has_justification_file
            ),
        )

    def _save_justification_file(self, upload: UploadFile) -> dict[str, str]:
        original_name = Path(upload.filename or "").name
        extension = Path(original_name).suffix.lower()
        if extension not in ALLOWED_JUSTIFICATION_EXTENSIONS:
            raise SecurityMeasureValidationError("Only .pdf and .docx justification files are allowed")

        content_type = upload.content_type or ""
        if content_type not in ALLOWED_JUSTIFICATION_MIME_TYPES:
            raise SecurityMeasureValidationError("Justification file MIME type is not allowed")

        TECHNICAL_SECURITY_MEASURE_JUSTIFICATION_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
        storage_name = f"{uuid4().hex}{extension}"
        storage_path = TECHNICAL_SECURITY_MEASURE_JUSTIFICATION_STORAGE_DIR / storage_name
        upload.file.seek(0)
        with storage_path.open("wb") as target:
            while chunk := upload.file.read(1024 * 1024):
                target.write(chunk)

        return {
            "justification_file_path": str(storage_path),
            "justification_file_name": original_name,
            "justification_file_content_type": content_type,
        }

    @staticmethod
    def _build_existing_file_metadata(record: TechnicalSecurityMeasureRecord | None) -> dict[str, str | None]:
        if record is None:
            return {
                "justification_file_path": None,
                "justification_file_name": None,
                "justification_file_content_type": None,
            }
        return {
            "justification_file_path": record.justification_file_path,
            "justification_file_name": record.justification_file_name,
            "justification_file_content_type": record.justification_file_content_type,
        }

    @staticmethod
    def _delete_existing_file(file_path: str | None) -> None:
        if not file_path:
            return
        path = Path(file_path)
        try:
            path.relative_to(TECHNICAL_SECURITY_MEASURE_JUSTIFICATION_STORAGE_DIR)
        except ValueError:
            return
        if path.exists() and path.is_file():
            path.unlink()
