from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.ispdn import IspdnCard, IspdnSystemCompositionItem
from app.models.security_measure import IspdnSecurityTools
from app.schemas.ispdn import IspdnCreate, IspdnStatus, IspdnUpdate


class IspdnRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self, organization_id: int, status: IspdnStatus | None = None) -> list[IspdnCard]:
        statement = (
            select(IspdnCard)
            .options(
                joinedload(IspdnCard.responsible_employee),
                joinedload(IspdnCard.security_tools),
                joinedload(IspdnCard.data_centers),
                selectinload(IspdnCard.system_composition_items),
            )
            .where(IspdnCard.organization_id == organization_id)
            .order_by(IspdnCard.updated_at.desc())
        )
        if status is not None:
            statement = statement.where(IspdnCard.status == status)
        return list(self.db.scalars(statement).unique().all())

    def get_by_id(self, ispdn_id: int, organization_id: int) -> IspdnCard | None:
        statement = (
            select(IspdnCard)
            .options(
                joinedload(IspdnCard.responsible_employee),
                joinedload(IspdnCard.security_tools),
                joinedload(IspdnCard.data_centers),
                selectinload(IspdnCard.system_composition_items),
            )
            .where(IspdnCard.id == ispdn_id, IspdnCard.organization_id == organization_id)
        )
        return self.db.scalars(statement).unique().first()

    def create(
        self,
        payload: IspdnCreate,
        responsible_person: str,
        organization_id: int,
    ) -> IspdnCard:
        values = payload.model_dump(exclude={"security_tools", "system_composition"})
        card = IspdnCard(**values, responsible_person=responsible_person, organization_id=organization_id)
        card.system_composition_items = self._build_system_composition_items(payload.system_composition)
        card.security_tools = IspdnSecurityTools(**payload.security_tools.model_dump()) if payload.security_tools else None
        self.db.add(card)
        self.db.commit()
        self.db.refresh(card)
        return self.get_by_id(card.id, organization_id) or card

    def update(
        self,
        card: IspdnCard,
        payload: IspdnUpdate,
        responsible_person: str,
    ) -> IspdnCard:
        values = payload.model_dump(exclude={"security_tools", "system_composition"})
        for field, value in values.items():
            setattr(card, field, value)
        card.responsible_person = responsible_person
        card.system_composition_items = self._build_system_composition_items(payload.system_composition)
        if payload.security_tools is not None:
            security_tools_values = payload.security_tools.model_dump()
            if card.security_tools is None:
                card.security_tools = IspdnSecurityTools(**security_tools_values)
            else:
                for field, value in security_tools_values.items():
                    setattr(card.security_tools, field, value)
        self.db.commit()
        self.db.refresh(card)
        return self.get_by_id(card.id, card.organization_id) or card

    def delete(self, card: IspdnCard) -> None:
        self.db.delete(card)
        self.db.commit()

    @staticmethod
    def _build_system_composition_items(items) -> list[IspdnSystemCompositionItem]:
        return [
            IspdnSystemCompositionItem(
                name=item.name,
                description=item.description,
                sort_order=index,
            )
            for index, item in enumerate(items)
        ]
