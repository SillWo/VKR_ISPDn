from sqlalchemy.orm import Session

from app.models.organization import OrganizationCard
from app.schemas.organization import OrganizationUpsert


ORGANIZATION_SINGLETON_ID = 1


class OrganizationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self) -> OrganizationCard | None:
        return self.db.get(OrganizationCard, ORGANIZATION_SINGLETON_ID)

    def create(self, payload: OrganizationUpsert) -> OrganizationCard:
        card = OrganizationCard(id=ORGANIZATION_SINGLETON_ID, **payload.model_dump())
        self.db.add(card)
        self.db.commit()
        self.db.refresh(card)
        return card

    def update(self, card: OrganizationCard, payload: OrganizationUpsert) -> OrganizationCard:
        for field, value in payload.model_dump().items():
            setattr(card, field, value)
        self.db.commit()
        self.db.refresh(card)
        return card

    def upsert(self, payload: OrganizationUpsert) -> OrganizationCard:
        card = self.get()
        if card is None:
            return self.create(payload)
        return self.update(card, payload)
