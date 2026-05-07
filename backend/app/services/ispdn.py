from app.models.ispdn import IspdnCard
from app.repositories.employee import EmployeeRepository
from app.repositories.ispdn import IspdnRepository
from app.repositories.processing_purpose import ProcessingPurposeRepository
from app.schemas.ispdn import IspdnCreate, IspdnUpdate


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

    def list_cards(self) -> list[IspdnCard]:
        return self.repository.list()

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
