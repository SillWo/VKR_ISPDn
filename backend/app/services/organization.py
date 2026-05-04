from app.models.organization import OrganizationCard
from app.repositories.organization import OrganizationRepository
from app.schemas.organization import OrganizationUpsert


class OrganizationNotFoundError(Exception):
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
        return self.repository.upsert(payload)
