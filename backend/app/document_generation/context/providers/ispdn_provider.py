from sqlalchemy.orm import Session

from app.repositories.employee import EmployeeRepository
from app.repositories.ispdn import IspdnRepository
from app.repositories.organization import OrganizationRepository
from app.services.ispdn import IspdnService
from app.services.organization import OrganizationService


class IspdnContextProvider:
    def __init__(self, db: Session, organization_id: int) -> None:
        self.organization_id = organization_id
        self.service = IspdnService(
            IspdnRepository(db),
            EmployeeRepository(db),
            OrganizationService(OrganizationRepository(db)),
        )

    def get_context(self, ispdn_id: int) -> dict:
        card = self.service.get_card(ispdn_id, self.organization_id)
        return {
            "ISPDn_name": card.name,
            "start_date": card.commissioning_date.strftime("%d.%m.%Y"),
        }
