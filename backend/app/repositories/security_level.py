from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.security_level import SecurityLevelRecord


class SecurityLevelRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_ispdn(self, ispdn_id: int) -> SecurityLevelRecord | None:
        statement = select(SecurityLevelRecord).where(SecurityLevelRecord.ispdn_id == ispdn_id)
        return self.db.scalars(statement).first()

    def create(self, values: dict) -> SecurityLevelRecord:
        record = SecurityLevelRecord(**values)
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record

    def update(self, record: SecurityLevelRecord, values: dict) -> SecurityLevelRecord:
        for field, value in values.items():
            setattr(record, field, value)
        self.db.commit()
        self.db.refresh(record)
        return record
