from sqlalchemy.orm import Session

from app.repositories.organization import OrganizationRepository
from app.services.organization import OrganizationNotFoundError, OrganizationService


EMPTY_VALUE = "Не заполнено"


class OrganizationContextProvider:
    def __init__(self, db: Session) -> None:
        self.service = OrganizationService(OrganizationRepository(db))

    def get_context(self) -> dict:
        try:
            card = self.service.get_card()
        except OrganizationNotFoundError:
            return {
                "company_city": EMPTY_VALUE,
                "full_organization_name": EMPTY_VALUE,
                "position_of_the_head_of_the_organization": EMPTY_VALUE,
            }

        return {
            "company_city": card.registration_city,
            "full_organization_name": card.full_legal_name,
            "position_of_the_head_of_the_organization": card.head_position,
        }
