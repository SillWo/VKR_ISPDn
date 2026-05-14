from sqlalchemy.orm import Session

from app.repositories.ispdn import IspdnRepository
from app.repositories.processing_process import ProcessingProcessRepository
from app.services.processing_process import ProcessingProcessService


class ProcessingContextProvider:
    def __init__(self, db: Session, organization_id: int) -> None:
        self.organization_id = organization_id
        self.service = ProcessingProcessService(
            ProcessingProcessRepository(db),
            IspdnRepository(db),
        )

    def get_context(self, ispdn_id: int) -> dict:
        return self.service.get_document_context(ispdn_id, self.organization_id).model_dump()
