from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.ispdn_processing_purpose import ispdn_processing_purposes
from app.models.processing_process import ProcessingProcess
from app.models.processing_purpose import ProcessingPurpose
from app.schemas.processing_purpose import ProcessingPurposeCreate, ProcessingPurposeUpdate


class ProcessingPurposeRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self) -> list[ProcessingPurpose]:
        statement = select(ProcessingPurpose).order_by(ProcessingPurpose.name.asc())
        return list(self.db.scalars(statement).all())

    def get_by_id(self, purpose_id: int) -> ProcessingPurpose | None:
        return self.db.get(ProcessingPurpose, purpose_id)

    def get_by_name(self, name: str) -> ProcessingPurpose | None:
        statement = select(ProcessingPurpose).where(ProcessingPurpose.name == name)
        return self.db.scalars(statement).first()

    def create(self, payload: ProcessingPurposeCreate) -> ProcessingPurpose:
        purpose = ProcessingPurpose(**payload.model_dump())
        self.db.add(purpose)
        self.db.commit()
        self.db.refresh(purpose)
        return purpose

    def update(self, purpose: ProcessingPurpose, payload: ProcessingPurposeUpdate) -> ProcessingPurpose:
        for field, value in payload.model_dump().items():
            setattr(purpose, field, value)
        self.db.commit()
        self.db.refresh(purpose)
        return purpose

    def delete(self, purpose: ProcessingPurpose) -> None:
        self.db.delete(purpose)
        self.db.commit()

    def is_used_by_processing_processes(self, purpose_id: int) -> bool:
        statement = select(ProcessingProcess.id).where(ProcessingProcess.processing_purpose_id == purpose_id).limit(1)
        return self.db.scalars(statement).first() is not None

    def is_used_by_ispdn_cards(self, purpose_id: int) -> bool:
        statement = (
            select(ispdn_processing_purposes.c.ispdn_id)
            .where(ispdn_processing_purposes.c.processing_purpose_id == purpose_id)
            .limit(1)
        )
        return self.db.scalars(statement).first() is not None
