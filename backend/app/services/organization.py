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


class OrganizationCardNotReadyError(Exception):
    pass


ORGANIZATION_CARD_NOT_READY_MESSAGE = "Вам нужно заполнить информацию о вашей организации."


class OrganizationService:
    def __init__(
        self,
        repository: OrganizationRepository,
        task_automation_service: "TaskAutomationService | None" = None,
    ) -> None:
        self.repository = repository
        self.task_automation_service = task_automation_service

    def get_card(self, organization_id: int) -> OrganizationCard:
        card = self.repository.get(organization_id)
        if card is None:
            raise OrganizationNotFoundError
        return card

    def validate_card_ready_for_ispdn_creation(self, organization_id: int) -> None:
        card = self.repository.get(organization_id)
        if card is None or not self._is_card_ready(card):
            raise OrganizationCardNotReadyError

    def upsert_card(self, payload: OrganizationUpsert, organization_id: int) -> OrganizationCard:
        self._validate_employee_ids(payload, organization_id)
        if payload.postal_address_matches_registration:
            payload.postal_address = None
        self._normalize_operator_fields(payload)
        existing_card = self.repository.get(organization_id)
        before_snapshot = self._snapshot(existing_card) if existing_card is not None else None
        card = self.repository.upsert(payload, organization_id)
        if self.task_automation_service is not None:
            self.task_automation_service.sync_fill_organization_card_task(organization_id)
        if (
            before_snapshot is not None
            and before_snapshot != self._payload_snapshot(payload)
            and self.task_automation_service is not None
        ):
            self.task_automation_service.create_organization_data_changed_events(organization_id)
        return card

    def _validate_employee_ids(self, payload: OrganizationUpsert, organization_id: int) -> None:
        employee_ids = {
            payload.head_employee_id,
            payload.document_approver_employee_id,
            payload.information_security_responsible_employee_id,
            payload.personal_data_processing_responsible_employee_id,
        }
        for employee_id in employee_ids:
            if employee_id is not None and not self.repository.employee_exists(employee_id, organization_id):
                raise OrganizationEmployeeNotFoundError

    @staticmethod
    def _normalize_operator_fields(payload: OrganizationUpsert) -> None:
        if payload.operator_type != "individual_entrepreneur":
            payload.identity_document_type = None
            payload.identity_document_name = None
            payload.identity_document_series = None
            payload.identity_document_number = None
            payload.identity_document_issued_by = None
            payload.identity_document_issued_date = None
            return

        payload.short_legal_name = None
        if payload.identity_document_type == "passport_rf":
            payload.identity_document_name = None

    @staticmethod
    def _is_card_ready(card: OrganizationCard) -> bool:
        required_fields = (
            card.operator_type,
            card.full_legal_name,
            card.registration_address,
            card.registration_city,
            card.inn,
            card.ogrn,
            card.head_employee_id,
            card.rkn_office_address,
            card.personal_data_processing_termination_type,
        )
        if any(not value for value in required_fields):
            return False

        if (
            card.personal_data_processing_termination_type == "end_date"
            and card.personal_data_processing_termination_date is None
        ):
            return False
        if (
            card.personal_data_processing_termination_type == "end_condition"
            and not card.personal_data_processing_termination_condition
        ):
            return False

        if card.operator_type in {"legal_entity", "state_body", "municipal_body"}:
            return bool(card.short_legal_name and card.kpp)

        if card.operator_type == "individual_entrepreneur":
            identity_fields = (
                card.identity_document_type,
                card.identity_document_series,
                card.identity_document_number,
                card.identity_document_issued_by,
                card.identity_document_issued_date,
            )
            if any(not value for value in identity_fields):
                return False
            if card.identity_document_type == "other_rf_document" and not card.identity_document_name:
                return False

        return True

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
