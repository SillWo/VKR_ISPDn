from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.processing_process import ProcessingProcess
from app.schemas.processing_process import ProcessingProcessCreate, ProcessingProcessUpdate


class ProcessingProcessRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_by_ispdn(self, ispdn_id: int) -> list[ProcessingProcess]:
        statement = (
            select(ProcessingProcess)
            .options(joinedload(ProcessingProcess.processing_purpose))
            .where(ProcessingProcess.ispdn_id == ispdn_id)
            .order_by(ProcessingProcess.created_at.asc(), ProcessingProcess.id.asc())
        )
        return list(self.db.scalars(statement).all())

    def get_for_ispdn(self, ispdn_id: int, process_id: int) -> ProcessingProcess | None:
        statement = (
            select(ProcessingProcess)
            .options(joinedload(ProcessingProcess.processing_purpose))
            .where(ProcessingProcess.ispdn_id == ispdn_id, ProcessingProcess.id == process_id)
        )
        return self.db.scalars(statement).first()

    def count_by_ispdn(self, ispdn_id: int) -> int:
        statement = select(func.count(ProcessingProcess.id)).where(ProcessingProcess.ispdn_id == ispdn_id)
        return self.db.scalar(statement) or 0

    def create(self, ispdn_id: int, payload: ProcessingProcessCreate) -> ProcessingProcess:
        process = ProcessingProcess(ispdn_id=ispdn_id, **payload.model_dump())
        self.db.add(process)
        self.db.commit()
        self.db.refresh(process)
        return self.get_for_ispdn(ispdn_id, process.id) or process

    def update(self, process: ProcessingProcess, payload: ProcessingProcessUpdate) -> ProcessingProcess:
        for field, value in payload.model_dump().items():
            setattr(process, field, value)
        self.db.commit()
        self.db.refresh(process)
        return self.get_for_ispdn(process.ispdn_id, process.id) or process

    def delete(self, process: ProcessingProcess) -> None:
        self.db.delete(process)
        self.db.commit()
