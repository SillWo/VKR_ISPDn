from pathlib import Path
from typing import TYPE_CHECKING
from uuid import uuid4

from fastapi import UploadFile

from app.domain.security_level_algorithm import (
    DATA_CATEGORY_LABELS,
    SUBJECT_COUNT_RANGE_LABELS,
    SUBJECT_GROUP_LABELS,
    THREAT_TYPE_LABELS,
    calculate_security_level,
    selected_data_category_labels,
)
from app.models.security_level import SecurityLevelRecord
from app.repositories.ispdn import IspdnRepository
from app.repositories.security_level import SecurityLevelRepository
from app.schemas.security_level import (
    SecurityLevelBase,
    SecurityLevelCalculationResult,
    SecurityLevelDocumentContext,
    SecurityLevelUpsert,
)
from app.services.ispdn import IspdnNotFoundError

if TYPE_CHECKING:
    from app.services.task_automation import TaskAutomationService


ALLOWED_JUSTIFICATION_EXTENSIONS = {".pdf", ".docx"}
ALLOWED_JUSTIFICATION_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
JUSTIFICATION_STORAGE_DIR = Path(__file__).resolve().parents[2] / "storage" / "security_level_justifications"


class SecurityLevelNotFoundError(Exception):
    pass


class SecurityLevelValidationError(Exception):
    pass


class SecurityLevelFileNotFoundError(Exception):
    pass


class SecurityLevelService:
    def __init__(
        self,
        repository: SecurityLevelRepository,
        ispdn_repository: IspdnRepository,
        task_automation_service: "TaskAutomationService | None" = None,
    ) -> None:
        self.repository = repository
        self.ispdn_repository = ispdn_repository
        self.task_automation_service = task_automation_service

    def get_record(self, ispdn_id: int, organization_id: int) -> SecurityLevelRecord:
        self._ensure_ispdn_exists(ispdn_id, organization_id)
        record = self.repository.get_by_ispdn(ispdn_id)
        if record is None:
            raise SecurityLevelNotFoundError
        return record

    def calculate(self, ispdn_id: int, payload: SecurityLevelBase, organization_id: int) -> SecurityLevelCalculationResult:
        self._ensure_ispdn_exists(ispdn_id, organization_id)
        result = calculate_security_level(
            payload.data_categories.model_dump(),
            payload.subject_count_range,
            payload.threat_type,
            payload.subject_group,
        )
        return SecurityLevelCalculationResult(**result)

    def upsert_record(
        self,
        ispdn_id: int,
        payload: SecurityLevelUpsert,
        organization_id: int,
        deviation_justification_file: UploadFile | None = None,
    ) -> SecurityLevelRecord:
        self._ensure_ispdn_exists(ispdn_id, organization_id)
        calculation = self.calculate(ispdn_id, payload, organization_id)
        actual_level_matches_recommended = payload.actual_level == calculation.recommended_level
        existing_record = self.repository.get_by_ispdn(ispdn_id)
        had_existing_record = existing_record is not None
        previous_actual_level = existing_record.actual_level if existing_record is not None else None

        file_metadata = self._build_existing_file_metadata(existing_record)
        if deviation_justification_file is not None:
            file_metadata = self._save_justification_file(deviation_justification_file)

        if actual_level_matches_recommended:
            self._delete_existing_file(file_metadata.get("deviation_justification_file_path"))
            file_metadata = self._empty_file_metadata()
            justification_text = None
        else:
            justification_text = payload.deviation_justification_text
            if not justification_text and not file_metadata.get("deviation_justification_file_path"):
                raise SecurityLevelValidationError(
                    "Deviation justification is required when actual level differs from recommended level",
                )

        values = {
            "ispdn_id": ispdn_id,
            "data_categories": payload.data_categories.model_dump(),
            "primary_data_category": calculation.primary_data_category,
            "subject_count_range": payload.subject_count_range,
            "threat_type": payload.threat_type,
            "subject_group": payload.subject_group,
            "employee_only": calculation.employee_only,
            "recommended_level": calculation.recommended_level,
            "actual_level": payload.actual_level,
            "actual_level_matches_recommended": actual_level_matches_recommended,
            "deviation_justification_text": justification_text,
            **file_metadata,
        }

        if existing_record is None:
            created_record = self.repository.create(values)
            if self.task_automation_service is not None:
                self.task_automation_service.sync_after_security_level_saved(
                    ispdn_id,
                    organization_id,
                    previous_actual_level=previous_actual_level,
                    current_actual_level=created_record.actual_level,
                    had_existing_record=had_existing_record,
                )
            return created_record

        old_file_path = existing_record.deviation_justification_file_path
        updated_record = self.repository.update(existing_record, values)
        if deviation_justification_file is not None and old_file_path != updated_record.deviation_justification_file_path:
            self._delete_existing_file(old_file_path)
        if self.task_automation_service is not None:
            self.task_automation_service.sync_after_security_level_saved(
                ispdn_id,
                organization_id,
                previous_actual_level=previous_actual_level,
                current_actual_level=updated_record.actual_level,
                had_existing_record=had_existing_record,
            )
        return updated_record

    def get_document_context(self, ispdn_id: int, organization_id: int) -> SecurityLevelDocumentContext:
        record = self.get_record(ispdn_id, organization_id)
        return SecurityLevelDocumentContext(
            ispdn_id=record.ispdn_id,
            data_categories=selected_data_category_labels(record.data_categories),
            primary_data_category=DATA_CATEGORY_LABELS[record.primary_data_category],
            subject_count_range=SUBJECT_COUNT_RANGE_LABELS[record.subject_count_range],
            threat_type=THREAT_TYPE_LABELS[record.threat_type],
            subject_group=SUBJECT_GROUP_LABELS[record.subject_group],
            employee_only=record.employee_only,
            recommended_level=record.recommended_level,
            actual_level=record.actual_level,
            actual_level_matches_recommended=record.actual_level_matches_recommended,
            deviation_justification_text=record.deviation_justification_text,
            deviation_justification_file_name=record.deviation_justification_file_name,
        )

    def get_justification_file(self, ispdn_id: int, organization_id: int) -> tuple[Path, str, str]:
        record = self.get_record(ispdn_id, organization_id)
        if not record.deviation_justification_file_path:
            raise SecurityLevelFileNotFoundError
        file_path = Path(record.deviation_justification_file_path)
        if not file_path.exists() or not file_path.is_file():
            raise SecurityLevelFileNotFoundError
        return (
            file_path,
            record.deviation_justification_file_name or file_path.name,
            record.deviation_justification_file_content_type or "application/octet-stream",
        )

    def _ensure_ispdn_exists(self, ispdn_id: int, organization_id: int) -> None:
        if self.ispdn_repository.get_by_id(ispdn_id, organization_id) is None:
            raise IspdnNotFoundError

    def _save_justification_file(self, upload: UploadFile) -> dict[str, str]:
        original_name = Path(upload.filename or "").name
        extension = Path(original_name).suffix.lower()
        if extension not in ALLOWED_JUSTIFICATION_EXTENSIONS:
            raise SecurityLevelValidationError("Only .pdf and .docx justification files are allowed")

        content_type = upload.content_type or ""
        if content_type not in ALLOWED_JUSTIFICATION_MIME_TYPES:
            raise SecurityLevelValidationError("Justification file MIME type is not allowed")

        JUSTIFICATION_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
        storage_name = f"{uuid4().hex}{extension}"
        storage_path = JUSTIFICATION_STORAGE_DIR / storage_name
        upload.file.seek(0)
        with storage_path.open("wb") as target:
            while chunk := upload.file.read(1024 * 1024):
                target.write(chunk)

        return {
            "deviation_justification_file_path": str(storage_path),
            "deviation_justification_file_name": original_name,
            "deviation_justification_file_content_type": content_type,
        }

    @staticmethod
    def _build_existing_file_metadata(record: SecurityLevelRecord | None) -> dict[str, str | None]:
        if record is None:
            return SecurityLevelService._empty_file_metadata()
        return {
            "deviation_justification_file_path": record.deviation_justification_file_path,
            "deviation_justification_file_name": record.deviation_justification_file_name,
            "deviation_justification_file_content_type": record.deviation_justification_file_content_type,
        }

    @staticmethod
    def _empty_file_metadata() -> dict[str, None]:
        return {
            "deviation_justification_file_path": None,
            "deviation_justification_file_name": None,
            "deviation_justification_file_content_type": None,
        }

    @staticmethod
    def _delete_existing_file(file_path: str | None) -> None:
        if not file_path:
            return
        path = Path(file_path)
        try:
            path.relative_to(JUSTIFICATION_STORAGE_DIR)
        except ValueError:
            return
        if path.exists() and path.is_file():
            path.unlink()
