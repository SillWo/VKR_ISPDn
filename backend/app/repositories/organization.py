from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.employee import Employee
from app.models.organization import OrganizationBranch, OrganizationCard, OrganizationOkved
from app.schemas.organization import OrganizationUpsert


ORGANIZATION_SINGLETON_ID = 1


class OrganizationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self) -> OrganizationCard | None:
        statement = (
            select(OrganizationCard)
            .options(
                selectinload(OrganizationCard.okveds),
                selectinload(OrganizationCard.branches),
                joinedload(OrganizationCard.head_employee).joinedload(Employee.department),
                joinedload(OrganizationCard.document_approver_employee).joinedload(Employee.department),
                joinedload(OrganizationCard.information_security_responsible_employee).joinedload(Employee.department),
                joinedload(OrganizationCard.personal_data_processing_responsible_employee).joinedload(Employee.department),
            )
            .where(OrganizationCard.id == ORGANIZATION_SINGLETON_ID)
        )
        return self.db.scalars(statement).first()

    def create(self, payload: OrganizationUpsert) -> OrganizationCard:
        data = self._simple_fields(payload)
        card = OrganizationCard(id=ORGANIZATION_SINGLETON_ID, **data)
        self._replace_okveds(card, payload)
        self._replace_branches(card, payload)
        self.db.add(card)
        self.db.commit()
        return self.get() or card

    def update(self, card: OrganizationCard, payload: OrganizationUpsert) -> OrganizationCard:
        for field, value in self._simple_fields(payload).items():
            setattr(card, field, value)
        self._replace_okveds(card, payload)
        self._replace_branches(card, payload)
        self.db.commit()
        return self.get() or card

    def upsert(self, payload: OrganizationUpsert) -> OrganizationCard:
        card = self.get()
        if card is None:
            return self.create(payload)
        return self.update(card, payload)

    def employee_exists(self, employee_id: int) -> bool:
        return self.db.scalars(select(Employee.id).where(Employee.id == employee_id).limit(1)).first() is not None

    def _simple_fields(self, payload: OrganizationUpsert) -> dict:
        return payload.model_dump(mode="json", exclude={"okveds", "branches"})

    def _replace_okveds(self, card: OrganizationCard, payload: OrganizationUpsert) -> None:
        card.okveds = [
            OrganizationOkved(code=item.code, name=item.name, sort_order=index)
            for index, item in enumerate(payload.okveds)
        ]

    def _replace_branches(self, card: OrganizationCard, payload: OrganizationUpsert) -> None:
        card.branches = [
            OrganizationBranch(name=item.name, postal_address=item.postal_address, sort_order=index)
            for index, item in enumerate(payload.branches)
        ]
