from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.ispdn import IspdnCard
from app.models.processing_purpose import ProcessingPurpose
from app.schemas.ispdn import IspdnCreate, IspdnUpdate


class IspdnRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self) -> list[IspdnCard]:
        statement = (
            select(IspdnCard)
            .options(joinedload(IspdnCard.responsible_employee), joinedload(IspdnCard.processing_purpose_options))
            .order_by(IspdnCard.updated_at.desc())
        )
        return list(self.db.scalars(statement).unique().all())

    def get_by_id(self, ispdn_id: int) -> IspdnCard | None:
        statement = (
            select(IspdnCard)
            .options(joinedload(IspdnCard.responsible_employee), joinedload(IspdnCard.processing_purpose_options))
            .where(IspdnCard.id == ispdn_id)
        )
        return self.db.scalars(statement).unique().first()

    def create(
        self,
        payload: IspdnCreate,
        responsible_person: str,
        processing_purposes: list[ProcessingPurpose],
    ) -> IspdnCard:
        values = payload.model_dump(exclude={"processing_purpose_ids"})
        values["processing_purposes"] = self._build_legacy_processing_purposes(processing_purposes)
        card = IspdnCard(**values, responsible_person=responsible_person)
        card.processing_purpose_options = processing_purposes
        self.db.add(card)
        self.db.commit()
        self.db.refresh(card)
        return self.get_by_id(card.id) or card

    def update(
        self,
        card: IspdnCard,
        payload: IspdnUpdate,
        responsible_person: str,
        processing_purposes: list[ProcessingPurpose],
    ) -> IspdnCard:
        values = payload.model_dump(exclude={"processing_purpose_ids"})
        values["processing_purposes"] = self._build_legacy_processing_purposes(processing_purposes)
        for field, value in values.items():
            setattr(card, field, value)
        card.responsible_person = responsible_person
        card.processing_purpose_options = processing_purposes
        self.db.commit()
        self.db.refresh(card)
        return self.get_by_id(card.id) or card

    def delete(self, card: IspdnCard) -> None:
        self.db.delete(card)
        self.db.commit()

    @staticmethod
    def _build_legacy_processing_purposes(processing_purposes: list[ProcessingPurpose]) -> str:
        return "\n".join(purpose.name for purpose in processing_purposes)
