from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.control_event import ControlEvent, ControlEventFile
from app.schemas.control_event import ControlEventCreate, ControlEventUpdate


class ControlEventRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self, organization_id: int) -> list[ControlEvent]:
        statement = (
            select(ControlEvent)
            .options(selectinload(ControlEvent.files))
            .where(ControlEvent.organization_id == organization_id)
            .order_by(ControlEvent.updated_at.desc(), ControlEvent.id.desc())
        )
        return list(self.db.scalars(statement).all())

    def list_options(self, organization_id: int) -> list[ControlEvent]:
        statement = select(ControlEvent).where(ControlEvent.organization_id == organization_id).order_by(ControlEvent.name.asc())
        return list(self.db.scalars(statement).all())

    def get_by_id(self, control_event_id: int, organization_id: int) -> ControlEvent | None:
        statement = (
            select(ControlEvent)
            .options(selectinload(ControlEvent.files))
            .where(ControlEvent.id == control_event_id, ControlEvent.organization_id == organization_id)
        )
        return self.db.scalars(statement).first()

    def get_by_name(self, name: str, organization_id: int) -> ControlEvent | None:
        statement = select(ControlEvent).where(ControlEvent.name == name, ControlEvent.organization_id == organization_id)
        return self.db.scalars(statement).first()

    def create(self, payload: ControlEventCreate, organization_id: int) -> ControlEvent:
        control_event = ControlEvent(**payload.model_dump(), organization_id=organization_id)
        self.db.add(control_event)
        self.db.commit()
        self.db.refresh(control_event)
        return self.get_by_id(control_event.id, organization_id) or control_event

    def update(self, control_event: ControlEvent, payload: ControlEventUpdate) -> ControlEvent:
        for field, value in payload.model_dump().items():
            setattr(control_event, field, value)
        self.db.commit()
        self.db.refresh(control_event)
        return self.get_by_id(control_event.id, control_event.organization_id) or control_event

    def delete(self, control_event: ControlEvent) -> None:
        self.db.delete(control_event)
        self.db.commit()

    def get_file(self, control_event_id: int, file_id: int) -> ControlEventFile | None:
        statement = select(ControlEventFile).where(
            ControlEventFile.control_event_id == control_event_id,
            ControlEventFile.id == file_id,
        )
        return self.db.scalars(statement).first()

    def add_file(self, values: dict) -> ControlEventFile:
        control_event_file = ControlEventFile(**values)
        self.db.add(control_event_file)
        self.db.commit()
        self.db.refresh(control_event_file)
        return control_event_file

    def delete_file(self, control_event_file: ControlEventFile) -> None:
        self.db.delete(control_event_file)
        self.db.commit()
