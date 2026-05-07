from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.ispdn import IspdnCard
from app.schemas.ispdn import IspdnCreate, IspdnUpdate


class IspdnRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self) -> list[IspdnCard]:
        statement = (
            select(IspdnCard)
            .options(joinedload(IspdnCard.responsible_employee))
            .order_by(IspdnCard.updated_at.desc())
        )
        return list(self.db.scalars(statement).all())

    def get_by_id(self, ispdn_id: int) -> IspdnCard | None:
        statement = (
            select(IspdnCard)
            .options(joinedload(IspdnCard.responsible_employee))
            .where(IspdnCard.id == ispdn_id)
        )
        return self.db.scalars(statement).first()

    def create(self, payload: IspdnCreate, responsible_person: str) -> IspdnCard:
        card = IspdnCard(**payload.model_dump(), responsible_person=responsible_person)
        self.db.add(card)
        self.db.commit()
        self.db.refresh(card)
        return self.get_by_id(card.id) or card

    def update(self, card: IspdnCard, payload: IspdnUpdate, responsible_person: str) -> IspdnCard:
        for field, value in payload.model_dump().items():
            setattr(card, field, value)
        card.responsible_person = responsible_person
        self.db.commit()
        self.db.refresh(card)
        return self.get_by_id(card.id) or card
