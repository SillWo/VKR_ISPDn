from app.models.processing_purpose import ProcessingPurpose
from app.repositories.processing_purpose import ProcessingPurposeRepository
from app.schemas.processing_purpose import ProcessingPurposeCreate, ProcessingPurposeUpdate


class ProcessingPurposeNotFoundError(Exception):
    pass


class ProcessingPurposeInUseError(Exception):
    pass


class ProcessingPurposeNameConflictError(Exception):
    pass


class ProcessingPurposeService:
    def __init__(self, repository: ProcessingPurposeRepository) -> None:
        self.repository = repository

    def list_purposes(self) -> list[ProcessingPurpose]:
        return self.repository.list()

    def list_options(self) -> list[ProcessingPurpose]:
        return self.repository.list()

    def get_purpose(self, purpose_id: int) -> ProcessingPurpose:
        purpose = self.repository.get_by_id(purpose_id)
        if purpose is None:
            raise ProcessingPurposeNotFoundError
        return purpose

    def create_purpose(self, payload: ProcessingPurposeCreate) -> ProcessingPurpose:
        self._ensure_unique_name(payload.name)
        return self.repository.create(payload)

    def update_purpose(self, purpose_id: int, payload: ProcessingPurposeUpdate) -> ProcessingPurpose:
        purpose = self.get_purpose(purpose_id)
        self._ensure_unique_name(payload.name, exclude_id=purpose_id)
        return self.repository.update(purpose, payload)

    def delete_purpose(self, purpose_id: int) -> None:
        purpose = self.get_purpose(purpose_id)
        if self.repository.is_used_by_processing_processes(purpose_id) or self.repository.is_used_by_ispdn_cards(
            purpose_id,
        ):
            raise ProcessingPurposeInUseError
        self.repository.delete(purpose)

    def _ensure_unique_name(self, name: str, exclude_id: int | None = None) -> None:
        purpose = self.repository.get_by_name(name)
        if purpose is not None and purpose.id != exclude_id:
            raise ProcessingPurposeNameConflictError
