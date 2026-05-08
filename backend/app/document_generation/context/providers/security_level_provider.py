from sqlalchemy.orm import Session

from app.repositories.ispdn import IspdnRepository
from app.repositories.security_level import SecurityLevelRepository
from app.services.security_level import SecurityLevelService


class SecurityLevelContextProvider:
    def __init__(self, db: Session) -> None:
        self.service = SecurityLevelService(SecurityLevelRepository(db), IspdnRepository(db))

    def get_context(self, ispdn_id: int) -> dict:
        return self.service.get_document_context(ispdn_id).model_dump()
