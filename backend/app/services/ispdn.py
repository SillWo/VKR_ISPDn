from app.models.ispdn import IspdnCard
from app.repositories.ispdn import IspdnRepository
from app.schemas.ispdn import IspdnCreate, IspdnUpdate


class IspdnNotFoundError(Exception):
    pass


class IspdnService:
    def __init__(self, repository: IspdnRepository) -> None:
        self.repository = repository

    def list_cards(self) -> list[IspdnCard]:
        return self.repository.list()

    def get_card(self, ispdn_id: int) -> IspdnCard:
        card = self.repository.get_by_id(ispdn_id)
        if card is None:
            raise IspdnNotFoundError
        return card

    def create_card(self, payload: IspdnCreate) -> IspdnCard:
        return self.repository.create(payload)

    def update_card(self, ispdn_id: int, payload: IspdnUpdate) -> IspdnCard:
        card = self.get_card(ispdn_id)
        return self.repository.update(card, payload)
