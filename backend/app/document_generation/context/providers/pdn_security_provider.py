from datetime import date

from sqlalchemy.orm import Session

from app.document_generation.core.errors import DocumentPrerequisiteMissingError
from app.models.organization import OrganizationCard
from app.repositories.organization import OrganizationRepository
from app.services.organization import OrganizationNotFoundError, OrganizationService


def _strip(value: object) -> str:
    if value is None:
        return ""
    return str(value).strip()


class PdnSecurityContextProvider:
    def __init__(self, db: Session, organization_id: int) -> None:
        self.organization_id = organization_id
        self.organization_service = OrganizationService(OrganizationRepository(db))

    def get_context(self, manual_data: dict) -> dict:
        try:
            organization = self.organization_service.get_card(self.organization_id)
        except OrganizationNotFoundError as exc:
            raise DocumentPrerequisiteMissingError("Карточка организации не заполнена.") from exc

        self._validate_organization(organization)

        generation_date = date.today()
        org_full_name = _strip(organization.full_legal_name)

        return {
            "order_number": manual_data["order_number"],
            "date": generation_date.strftime("%d.%m.%Y"),
            "org_city": _strip(organization.registration_city),
            "org_full_name": org_full_name,
            "ORG_FULL_NAME": org_full_name,
            "main_post": _strip(organization.head_position),
            "main_FIO": self._head_full_name(organization),
            "year": generation_date.strftime("%Y"),
        }

    def _validate_organization(self, organization: OrganizationCard) -> None:
        if not _strip(organization.registration_city):
            raise DocumentPrerequisiteMissingError("В карточке организации не указан город регистрации.")
        if not _strip(organization.full_legal_name):
            raise DocumentPrerequisiteMissingError("В карточке организации не указано полное наименование организации.")
        if not _strip(organization.head_position):
            raise DocumentPrerequisiteMissingError("В карточке организации не указана должность руководителя.")
        if not _strip(organization.head_full_name) and organization.head_employee is None:
            raise DocumentPrerequisiteMissingError("В карточке организации не указан руководитель организации.")

    def _head_full_name(self, organization: OrganizationCard) -> str:
        if organization.head_employee is not None:
            return organization.head_employee.full_name
        return _strip(organization.head_full_name)
