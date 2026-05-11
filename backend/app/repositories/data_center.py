from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.data_center import DataCenter
from app.models.ispdn import IspdnCard
from app.schemas.data_center import DataCenterCreate, DataCenterUpdate


class DataCenterRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self) -> list[DataCenter]:
        statement = select(DataCenter).order_by(DataCenter.name.asc(), DataCenter.id.asc())
        return list(self.db.scalars(statement).all())

    def list_options(self) -> list[DataCenter]:
        return self.list()

    def get_by_id(self, data_center_id: int) -> DataCenter | None:
        statement = (
            select(DataCenter)
            .options(selectinload(DataCenter.ispdn_cards))
            .where(DataCenter.id == data_center_id)
        )
        return self.db.scalars(statement).first()

    def get_many_by_ids(self, data_center_ids: list[int]) -> list[DataCenter]:
        if not data_center_ids:
            return []
        statement = (
            select(DataCenter)
            .where(DataCenter.id.in_(data_center_ids))
            .order_by(DataCenter.name.asc(), DataCenter.id.asc())
        )
        return list(self.db.scalars(statement).all())

    def create(self, payload: DataCenterCreate) -> DataCenter:
        data_center = DataCenter(**payload.model_dump())
        self.db.add(data_center)
        self.db.commit()
        self.db.refresh(data_center)
        return data_center

    def update(self, data_center: DataCenter, payload: DataCenterUpdate) -> DataCenter:
        for field, value in payload.model_dump().items():
            setattr(data_center, field, value)
        self.db.commit()
        self.db.refresh(data_center)
        return data_center

    def delete(self, data_center: DataCenter) -> None:
        self.db.delete(data_center)
        self.db.commit()

    def list_for_ispdn(self, ispdn_id: int) -> list[DataCenter]:
        statement = (
            select(DataCenter)
            .join(DataCenter.ispdn_cards)
            .where(IspdnCard.id == ispdn_id)
            .order_by(DataCenter.name.asc(), DataCenter.id.asc())
        )
        return list(self.db.scalars(statement).all())

    def set_for_ispdn(self, ispdn: IspdnCard, data_center_ids: list[int]) -> list[DataCenter]:
        data_centers = self.get_many_by_ids(data_center_ids)
        ispdn.data_centers = data_centers
        self.db.commit()
        self.db.refresh(ispdn)
        return self.list_for_ispdn(ispdn.id)

    def count_ispdn_links(self, data_center_id: int) -> int:
        data_center = self.get_by_id(data_center_id)
        if data_center is None:
            return 0
        return len(data_center.ispdn_cards)

    def get_ispdn_by_id(self, ispdn_id: int) -> IspdnCard | None:
        return self.db.get(IspdnCard, ispdn_id)

    def count_existing_ids(self, data_center_ids: list[int]) -> int:
        if not data_center_ids:
            return 0
        statement = select(func.count(DataCenter.id)).where(DataCenter.id.in_(data_center_ids))
        return int(self.db.scalar(statement) or 0)
