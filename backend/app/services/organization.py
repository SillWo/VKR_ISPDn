from app.models.organization import OrganizationCard
from app.repositories.organization import OrganizationRepository
from app.schemas.organization import OrganizationUpsert


class OrganizationNotFoundError(Exception):
    pass


class OrganizationEmployeeNotFoundError(Exception):
    pass


class OrganizationService:
    def __init__(self, repository: OrganizationRepository) -> None:
        self.repository = repository

    def get_card(self) -> OrganizationCard:
        card = self.repository.get()
        if card is None:
            raise OrganizationNotFoundError
        return card

    def upsert_card(self, payload: OrganizationUpsert) -> OrganizationCard:
        self._validate_employee_ids(payload)
        if payload.postal_address_matches_registration:
            payload.postal_address = None
        return self.repository.upsert(payload)

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
