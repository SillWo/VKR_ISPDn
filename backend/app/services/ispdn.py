from pathlib import Path
from typing import TYPE_CHECKING

from app.models.ispdn import IspdnCard
from app.repositories.employee import EmployeeRepository
from app.repositories.ispdn import IspdnRepository
from app.schemas.ispdn import IspdnCreate, IspdnStatus, IspdnUpdate

if TYPE_CHECKING:
    from app.services.organization import OrganizationService
    from app.services.task_automation import TaskAutomationService


SECURITY_LEVEL_JUSTIFICATION_STORAGE_DIR = (
    Path(__file__).resolve().parents[2] / "storage" / "security_level_justifications"
)


class IspdnNotFoundError(Exception):
    pass


class IspdnResponsibleEmployeeNotFoundError(Exception):
    pass


class IspdnService:
    def __init__(
        self,
        repository: IspdnRepository,
        employee_repository: EmployeeRepository,
        organization_service: "OrganizationService",
        task_automation_service: "TaskAutomationService | None" = None,
    ) -> None:
        self.repository = repository
        self.employee_repository = employee_repository
        self.organization_service = organization_service
        self.task_automation_service = task_automation_service

    def list_cards(self, organization_id: int, status: IspdnStatus | None = None) -> list[IspdnCard]:
        return self.repository.list(organization_id, status)

    def get_card(self, ispdn_id: int, organization_id: int) -> IspdnCard:
        card = self.repository.get_by_id(ispdn_id, organization_id)
        if card is None:
            raise IspdnNotFoundError
        return card

    def create_card(self, payload: IspdnCreate, organization_id: int) -> IspdnCard:
        self.organization_service.validate_card_ready_for_ispdn_creation(organization_id)
        employee = self.employee_repository.get_by_id(payload.responsible_employee_id, organization_id)
        if employee is None:
            raise IspdnResponsibleEmployeeNotFoundError
        card = self.repository.create(payload, responsible_person=employee.full_name, organization_id=organization_id)
        if self.task_automation_service is not None:
            self.task_automation_service.create_ispdn_created_event(card.id, organization_id)
            self.task_automation_service.sync_create_first_ispdn_task(organization_id)
        return card

    def update_card(self, ispdn_id: int, payload: IspdnUpdate, organization_id: int) -> IspdnCard:
        card = self.get_card(ispdn_id, organization_id)
        employee = self.employee_repository.get_by_id(payload.responsible_employee_id, organization_id)
        if employee is None:
            raise IspdnResponsibleEmployeeNotFoundError
        return self.repository.update(
            card,
            payload,
            responsible_person=employee.full_name,
        )

    def delete_card(self, ispdn_id: int, organization_id: int) -> None:
        card = self.get_card(ispdn_id, organization_id)
        self._delete_security_level_justification_file(card)
        self.repository.delete(card)

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
