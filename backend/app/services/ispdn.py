from pathlib import Path

from app.models.ispdn import IspdnCard
from app.repositories.employee import EmployeeRepository
from app.repositories.ispdn import IspdnRepository
from app.repositories.processing_purpose import ProcessingPurposeRepository
from app.schemas.ispdn import IspdnCreate, IspdnStatus, IspdnUpdate


SECURITY_LEVEL_JUSTIFICATION_STORAGE_DIR = (
    Path(__file__).resolve().parents[2] / "storage" / "security_level_justifications"
)


class IspdnNotFoundError(Exception):
    pass


class IspdnResponsibleEmployeeNotFoundError(Exception):
    pass


class IspdnProcessingPurposeNotFoundError(Exception):
    pass


class IspdnService:
    def __init__(
        self,
        repository: IspdnRepository,
        employee_repository: EmployeeRepository,
        processing_purpose_repository: ProcessingPurposeRepository,
    ) -> None:
        self.repository = repository
        self.employee_repository = employee_repository
        self.processing_purpose_repository = processing_purpose_repository

    def list_cards(self, status: IspdnStatus | None = None) -> list[IspdnCard]:
        return self.repository.list(status)

    def get_card(self, ispdn_id: int) -> IspdnCard:
        card = self.repository.get_by_id(ispdn_id)
        if card is None:
            raise IspdnNotFoundError
        return card

    def create_card(self, payload: IspdnCreate) -> IspdnCard:
        employee = self.employee_repository.get_by_id(payload.responsible_employee_id)
        if employee is None:
            raise IspdnResponsibleEmployeeNotFoundError
        processing_purposes = self._get_processing_purposes(payload.processing_purpose_ids)
        return self.repository.create(payload, responsible_person=employee.full_name, processing_purposes=processing_purposes)

    def update_card(self, ispdn_id: int, payload: IspdnUpdate) -> IspdnCard:
        card = self.get_card(ispdn_id)
        employee = self.employee_repository.get_by_id(payload.responsible_employee_id)
        if employee is None:
            raise IspdnResponsibleEmployeeNotFoundError
        processing_purposes = self._get_processing_purposes(payload.processing_purpose_ids)
        return self.repository.update(
            card,
            payload,
            responsible_person=employee.full_name,
            processing_purposes=processing_purposes,
        )

    def delete_card(self, ispdn_id: int) -> None:
        card = self.get_card(ispdn_id)
        self._delete_security_level_justification_file(card)
        self.repository.delete(card)

    def _get_processing_purposes(self, purpose_ids: list[int]):
        purposes = []
        seen_ids: set[int] = set()
        for purpose_id in purpose_ids:
            if purpose_id in seen_ids:
                continue
            purpose = self.processing_purpose_repository.get_by_id(purpose_id)
            if purpose is None:
                raise IspdnProcessingPurposeNotFoundError
            purposes.append(purpose)
            seen_ids.add(purpose_id)
        return purposes

    @staticmethod
    def _delete_security_level_justification_file(card: IspdnCard) -> None:
        record = card.security_level_record
        if record is None or not record.deviation_justification_file_path:
            return

        file_path = Path(record.deviation_justification_file_path)
        try:
            file_path.relative_to(SECURITY_LEVEL_JUSTIFICATION_STORAGE_DIR)
        except ValueError:
            return

        if file_path.exists() and file_path.is_file():
            file_path.unlink()
