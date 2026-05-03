from sqlalchemy.orm import Session

from app.repositories.ispdn import IspdnRepository
from app.services.ispdn import IspdnService


class IspdnContextProvider:
    def __init__(self, db: Session) -> None:
        self.service = IspdnService(IspdnRepository(db))

    def get_context(self, ispdn_id: int) -> dict:
        card = self.service.get_card(ispdn_id)
        return {"ISPDn_name": card.name}
