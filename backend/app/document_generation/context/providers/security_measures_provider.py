from sqlalchemy.orm import Session

from app.repositories.ispdn import IspdnRepository
from app.repositories.security_level import SecurityLevelRepository
from app.repositories.security_measure import SecurityMeasureRepository
from app.services.security_measure import SecurityMeasureService


class SecurityMeasuresContextProvider:
    def __init__(self, db: Session, organization_id: int) -> None:
        self.organization_id = organization_id
        self.service = SecurityMeasureService(SecurityMeasureRepository(db), IspdnRepository(db), SecurityLevelRepository(db))

    def get_context(self, ispdn_id: int) -> dict:
        return self.service.get_document_context(ispdn_id, self.organization_id)
