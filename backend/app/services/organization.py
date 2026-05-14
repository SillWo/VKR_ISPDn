from datetime import date
from typing import TYPE_CHECKING, Any

from app.models.organization import OrganizationCard
from app.repositories.organization import OrganizationRepository
from app.schemas.organization import OrganizationUpsert

if TYPE_CHECKING:
    from app.services.task_automation import TaskAutomationService


class OrganizationNotFoundError(Exception):
    pass


class OrganizationEmployeeNotFoundError(Exception):
    pass


class OrganizationService:
    def __init__(
        self,
        repository: OrganizationRepository,
        task_automation_service: "TaskAutomationService | None" = None,
    ) -> None:
        self.repository = repository
        self.task_automation_service = task_automation_service

    def get_card(self) -> OrganizationCard:
        card = self.repository.get()
        if card is None:
            raise OrganizationNotFoundError
        return card

    def upsert_card(self, payload: OrganizationUpsert) -> OrganizationCard:
        self._validate_employee_ids(payload)
        if payload.postal_address_matches_registration:
            payload.postal_address = None
        existing_card = self.repository.get()
        before_snapshot = self._snapshot(existing_card) if existing_card is not None else None
        card = self.repository.upsert(payload)
        if (
            before_snapshot is not None
            and before_snapshot != self._payload_snapshot(payload)
            and self.task_automation_service is not None
        ):
            self.task_automation_service.create_organization_data_changed_events()
        return card

    def _validate_employee_ids(self, payload: OrganizationUpsert) -> None:
        employee_ids = {
            payload.head_employee_id,
            payload.document_approver_employee_id,
            payload.information_security_responsible_employee_id,
            payload.personal_data_processing_responsible_employee_id,
        }
        for employee_id in employee_ids:
            if employee_id is not None and not self.repository.employee_exists(employee_id):
                raise OrganizationEmployeeNotFoundError

    def _snapshot(self, card: OrganizationCard) -> dict[str, Any]:
        simple_fields = set(OrganizationUpsert.model_fields) - {"okveds", "branches"}
        return {
            "simple": {field: self._json_value(getattr(card, field)) for field in sorted(simple_fields)},
            "okveds": [(item.code, item.name) for item in card.okveds],
            "branches": [(item.name, item.postal_address) for item in card.branches],
        }

    def _payload_snapshot(self, payload: OrganizationUpsert) -> dict[str, Any]:
        data = payload.model_dump(mode="json")
        return {
            "simple": {field: data.get(field) for field in sorted(set(data) - {"okveds", "branches"})},
            "okveds": [(item.code, item.name) for item in payload.okveds],
            "branches": [(item.name, item.postal_address) for item in payload.branches],
        }

    @staticmethod
    def _json_value(value: Any) -> Any:
        if isinstance(value, date):
            return value.isoformat()
        return value
