from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.models.control_event import ControlEvent, ControlEventFile
from app.repositories.control_event import ControlEventRepository
from app.schemas.control_event import ControlEventCreate, ControlEventUpdate

CONTROL_EVENT_FILE_STORAGE_DIR = Path(__file__).resolve().parents[2] / "storage" / "control_event_files"
ALLOWED_CONTROL_EVENT_FILE_EXTENSIONS = {".pdf", ".docx", ".xlsx"}
ALLOWED_CONTROL_EVENT_FILE_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}


class ControlEventNotFoundError(Exception):
    pass


class ControlEventNameConflictError(Exception):
    pass


class ControlEventFileNotFoundError(Exception):
    pass


class ControlEventFileValidationError(Exception):
    pass


class ControlEventService:
    def __init__(self, repository: ControlEventRepository) -> None:
        self.repository = repository

    def list_control_events(self) -> list[ControlEvent]:
        return self.repository.list()

    def list_options(self) -> list[ControlEvent]:
        return self.repository.list_options()

    def get_control_event(self, control_event_id: int) -> ControlEvent:
        control_event = self.repository.get_by_id(control_event_id)
        if control_event is None:
            raise ControlEventNotFoundError
        return control_event

    def create_control_event(self, payload: ControlEventCreate) -> ControlEvent:
        self._ensure_unique_name(payload.name)
        return self.repository.create(payload)

    def update_control_event(self, control_event_id: int, payload: ControlEventUpdate) -> ControlEvent:
        control_event = self.get_control_event(control_event_id)
        self._ensure_unique_name(payload.name, exclude_id=control_event_id)
        return self.repository.update(control_event, payload)

    def delete_control_event(self, control_event_id: int) -> None:
        control_event = self.get_control_event(control_event_id)
        file_paths = [Path(control_event_file.file_path) for control_event_file in control_event.files]
        self.repository.delete(control_event)
        for file_path in file_paths:
            self._delete_file_from_storage(file_path)

    def upload_file(self, control_event_id: int, upload: UploadFile) -> ControlEventFile:
        self.get_control_event(control_event_id)
        file_metadata = self._save_upload(upload)
        return self.repository.add_file({"control_event_id": control_event_id, **file_metadata})

    def get_file(self, control_event_id: int, file_id: int) -> tuple[Path, str, str]:
        self.get_control_event(control_event_id)
        control_event_file = self.repository.get_file(control_event_id, file_id)
        if control_event_file is None:
            raise ControlEventFileNotFoundError

        file_path = Path(control_event_file.file_path)
        if not self._is_inside_storage(file_path) or not file_path.exists() or not file_path.is_file():
            raise ControlEventFileNotFoundError
        return file_path, control_event_file.file_name, control_event_file.file_content_type

    def delete_file(self, control_event_id: int, file_id: int) -> None:
        self.get_control_event(control_event_id)
        control_event_file = self.repository.get_file(control_event_id, file_id)
        if control_event_file is None:
            raise ControlEventFileNotFoundError

        file_path = Path(control_event_file.file_path)
        self.repository.delete_file(control_event_file)
        self._delete_file_from_storage(file_path)

    def _ensure_unique_name(self, name: str, exclude_id: int | None = None) -> None:
        control_event = self.repository.get_by_name(name)
        if control_event is not None and control_event.id != exclude_id:
            raise ControlEventNameConflictError

    def _save_upload(self, upload: UploadFile) -> dict[str, str | int]:
        original_name = Path(upload.filename or "").name
        extension = Path(original_name).suffix.lower()
        if extension not in ALLOWED_CONTROL_EVENT_FILE_EXTENSIONS:
            raise ControlEventFileValidationError("Only .pdf, .docx and .xlsx files are allowed")

        content_type = upload.content_type or ""
        if content_type not in ALLOWED_CONTROL_EVENT_FILE_MIME_TYPES:
            raise ControlEventFileValidationError("Only .pdf, .docx and .xlsx files are allowed")

        CONTROL_EVENT_FILE_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
        storage_path = CONTROL_EVENT_FILE_STORAGE_DIR / f"{uuid4().hex}{extension}"
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
    def _is_inside_storage(file_path: Path) -> bool:
        try:
            file_path.resolve().relative_to(CONTROL_EVENT_FILE_STORAGE_DIR.resolve())
        except ValueError:
            return False
        return True

    def _delete_file_from_storage(self, file_path: Path) -> None:
        if not self._is_inside_storage(file_path):
            return
        if file_path.exists() and file_path.is_file():
            file_path.unlink()
