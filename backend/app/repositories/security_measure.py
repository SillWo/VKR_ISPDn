from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.security_measure import (
    IspdnSecurityTools,
    TechnicalSecurityMeasureDocument,
    TechnicalSecurityMeasureRecord,
)


class SecurityMeasureRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_security_tools(self, ispdn_id: int) -> IspdnSecurityTools | None:
        statement = select(IspdnSecurityTools).where(IspdnSecurityTools.ispdn_id == ispdn_id)
        return self.db.scalars(statement).first()

    def create_security_tools(self, values: dict) -> IspdnSecurityTools:
        record = IspdnSecurityTools(**values)
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record

    def update_security_tools(self, record: IspdnSecurityTools, values: dict) -> IspdnSecurityTools:
        for field, value in values.items():
            setattr(record, field, value)
        self.db.commit()
        self.db.refresh(record)
        return record

    def get_measure_records(self, ispdn_id: int) -> list[TechnicalSecurityMeasureRecord]:
        statement = select(TechnicalSecurityMeasureRecord).where(TechnicalSecurityMeasureRecord.ispdn_id == ispdn_id)
        return list(self.db.scalars(statement).all())

    def get_measure_record(self, ispdn_id: int, measure_code: str) -> TechnicalSecurityMeasureRecord | None:
        statement = select(TechnicalSecurityMeasureRecord).where(
            TechnicalSecurityMeasureRecord.ispdn_id == ispdn_id,
            TechnicalSecurityMeasureRecord.measure_code == measure_code,
        )
        return self.db.scalars(statement).first()

    def create_measure_record(self, values: dict) -> TechnicalSecurityMeasureRecord:
        record = TechnicalSecurityMeasureRecord(**values)
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record

    def update_measure_record(
        self,
        record: TechnicalSecurityMeasureRecord,
        values: dict,
    ) -> TechnicalSecurityMeasureRecord:
        for field, value in values.items():
            setattr(record, field, value)
        self.db.commit()
        self.db.refresh(record)
        return record

    def get_documents(self, ispdn_id: int) -> list[TechnicalSecurityMeasureDocument]:
        statement = (
            select(TechnicalSecurityMeasureDocument)
            .where(TechnicalSecurityMeasureDocument.ispdn_id == ispdn_id)
            .order_by(TechnicalSecurityMeasureDocument.created_at.desc(), TechnicalSecurityMeasureDocument.id.desc())
        )
        return list(self.db.scalars(statement).all())

    def get_document(self, ispdn_id: int, document_id: int) -> TechnicalSecurityMeasureDocument | None:
        statement = select(TechnicalSecurityMeasureDocument).where(
            TechnicalSecurityMeasureDocument.ispdn_id == ispdn_id,
            TechnicalSecurityMeasureDocument.id == document_id,
        )
        return self.db.scalars(statement).first()

    def create_document(self, values: dict) -> TechnicalSecurityMeasureDocument:
        document = TechnicalSecurityMeasureDocument(**values)
        self.db.add(document)
        self.db.commit()
        self.db.refresh(document)
        return document

    def delete_document(self, document: TechnicalSecurityMeasureDocument) -> None:
        self.db.delete(document)
        self.db.commit()
