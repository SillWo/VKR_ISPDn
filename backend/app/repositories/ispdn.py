from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.ispdn import IspdnCard
from app.schemas.ispdn import IspdnCreate, IspdnUpdate


class IspdnRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self) -> list[IspdnCard]:
        statement = select(IspdnCard).order_by(IspdnCard.updated_at.desc())
        return list(self.db.scalars(statement).all())

    def get_by_id(self, ispdn_id: int) -> IspdnCard | None:
        return self.db.get(IspdnCard, ispdn_id)

    def create(self, payload: IspdnCreate) -> IspdnCard:
        card = IspdnCard(**payload.model_dump())
        self.db.add(card)
        self.db.commit()
        self.db.refresh(card)
        return card

    def update(self, card: IspdnCard, payload: IspdnUpdate) -> IspdnCard:
        for field, value in payload.model_dump().items():
            setattr(card, field, value)
        self.db.commit()
        self.db.refresh(card)
        return card
