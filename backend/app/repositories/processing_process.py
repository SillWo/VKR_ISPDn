from typing import Any

from sqlalchemy import delete, func, insert, select
from sqlalchemy.orm import Session, selectinload

from app.models.ispdn import IspdnCard
from app.models.ispdn_processing_process import ispdn_processing_processes
from app.models.processing_process import ProcessingProcess


class ProcessingProcessRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_registry(self, organization_id: int) -> list[ProcessingProcess]:
        statement = (
            select(ProcessingProcess)
            .options(selectinload(ProcessingProcess.ispdn_cards))
            .where(ProcessingProcess.organization_id == organization_id)
            .order_by(ProcessingProcess.purpose_name.asc(), ProcessingProcess.id.asc())
        )
        return list(self.db.scalars(statement).all())

    def list_options(self, organization_id: int) -> list[ProcessingProcess]:
        statement = (
            select(ProcessingProcess)
            .where(ProcessingProcess.organization_id == organization_id)
            .order_by(ProcessingProcess.purpose_name.asc(), ProcessingProcess.id.asc())
        )
        return list(self.db.scalars(statement).all())

    def list_unique_for_active_ispdns(self, organization_id: int) -> list[ProcessingProcess]:
        statement = (
            select(ProcessingProcess)
            .join(
                ispdn_processing_processes,
                ispdn_processing_processes.c.processing_process_id == ProcessingProcess.id,
            )
            .join(IspdnCard, IspdnCard.id == ispdn_processing_processes.c.ispdn_id)
            .where(IspdnCard.status == "active", IspdnCard.organization_id == organization_id)
            .distinct()
            .order_by(ProcessingProcess.purpose_name.asc(), ProcessingProcess.id.asc())
        )
        return list(self.db.scalars(statement).all())

    def get_by_id(self, process_id: int, organization_id: int) -> ProcessingProcess | None:
        statement = (
            select(ProcessingProcess)
            .options(selectinload(ProcessingProcess.ispdn_cards))
            .where(ProcessingProcess.id == process_id, ProcessingProcess.organization_id == organization_id)
        )
        return self.db.scalars(statement).first()

    def get_by_signature(self, process_signature: str, organization_id: int) -> ProcessingProcess | None:
        statement = (
            select(ProcessingProcess)
            .options(selectinload(ProcessingProcess.ispdn_cards))
            .where(
                ProcessingProcess.process_signature == process_signature,
                ProcessingProcess.organization_id == organization_id,
            )
        )
        return self.db.scalars(statement).first()

    def create(self, values: dict[str, Any], process_signature: str, organization_id: int) -> ProcessingProcess:
        process = ProcessingProcess(**values, process_signature=process_signature, organization_id=organization_id)
        self.db.add(process)
        self.db.commit()
        self.db.refresh(process)
        return self.get_by_id(process.id, organization_id) or process

    def update(
        self,
        process: ProcessingProcess,
        values: dict[str, Any],
        process_signature: str,
    ) -> ProcessingProcess:
        for field, value in values.items():
            setattr(process, field, value)
        process.process_signature = process_signature
        self.db.commit()
        self.db.refresh(process)
        return self.get_by_id(process.id, process.organization_id) or process

    def delete(self, process: ProcessingProcess) -> None:
        self.db.delete(process)
        self.db.commit()

    def count_linked_ispdns(self, process_id: int) -> int:
        statement = select(func.count()).select_from(ispdn_processing_processes).where(
            ispdn_processing_processes.c.processing_process_id == process_id,
        )
        return self.db.scalar(statement) or 0

    def list_by_ispdn(self, ispdn_id: int) -> list[ProcessingProcess]:
        statement = (
            select(ProcessingProcess)
            .join(
                ispdn_processing_processes,
                ispdn_processing_processes.c.processing_process_id == ProcessingProcess.id,
            )
            .where(ispdn_processing_processes.c.ispdn_id == ispdn_id)
            .order_by(ispdn_processing_processes.c.created_at.asc(), ProcessingProcess.id.asc())
        )
        return list(self.db.scalars(statement).all())

    def list_by_purpose_and_period_excluding(
        self,
        process_id: int,
        purpose_name: str,
        processing_period: str,
        organization_id: int,
    ) -> list[ProcessingProcess]:
        statement = (
            select(ProcessingProcess)
            .where(
                ProcessingProcess.id != process_id,
                ProcessingProcess.organization_id == organization_id,
                func.lower(func.trim(ProcessingProcess.purpose_name)) == purpose_name.strip().casefold(),
                func.lower(func.trim(ProcessingProcess.processing_period)) == processing_period.strip().casefold(),
            )
            .order_by(ProcessingProcess.id.asc())
        )
        return list(self.db.scalars(statement).all())

    def list_active_ispdns_for_process(self, process_id: int, organization_id: int) -> list[IspdnCard]:
        statement = (
            select(IspdnCard)
            .join(
                ispdn_processing_processes,
                ispdn_processing_processes.c.ispdn_id == IspdnCard.id,
            )
            .where(
                ispdn_processing_processes.c.processing_process_id == process_id,
                IspdnCard.status == "active",
                IspdnCard.organization_id == organization_id,
            )
            .order_by(IspdnCard.id.asc())
        )
        return list(self.db.scalars(statement).all())

    def is_linked_to_ispdn(self, ispdn_id: int, process_id: int) -> bool:
        statement = select(ispdn_processing_processes.c.ispdn_id).where(
            ispdn_processing_processes.c.ispdn_id == ispdn_id,
            ispdn_processing_processes.c.processing_process_id == process_id,
        )
        return self.db.execute(statement).first() is not None

    def link_to_ispdn(self, ispdn_id: int, process_id: int) -> None:
        if self.is_linked_to_ispdn(ispdn_id, process_id):
            return
        self.db.execute(
            insert(ispdn_processing_processes).values(
                ispdn_id=ispdn_id,
                processing_process_id=process_id,
            ),
        )
        self.db.commit()

    def unlink_from_ispdn(self, ispdn_id: int, process_id: int) -> None:
        self.db.execute(
            delete(ispdn_processing_processes).where(
                ispdn_processing_processes.c.ispdn_id == ispdn_id,
                ispdn_processing_processes.c.processing_process_id == process_id,
            ),
        )
        self.db.commit()

    def replace_link_for_ispdn(self, ispdn_id: int, old_process_id: int, new_process_id: int) -> None:
        if old_process_id == new_process_id:
            return
        self.db.execute(
            delete(ispdn_processing_processes).where(
                ispdn_processing_processes.c.ispdn_id == ispdn_id,
                ispdn_processing_processes.c.processing_process_id == old_process_id,
            ),
        )
        if not self.is_linked_to_ispdn(ispdn_id, new_process_id):
            self.db.execute(
                insert(ispdn_processing_processes).values(
                    ispdn_id=ispdn_id,
                    processing_process_id=new_process_id,
                ),
            )
        self.db.commit()
