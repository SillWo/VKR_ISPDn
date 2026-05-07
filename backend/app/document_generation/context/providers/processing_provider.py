from sqlalchemy.orm import Session

from app.repositories.ispdn import IspdnRepository
from app.repositories.processing_process import ProcessingProcessRepository
from app.repositories.processing_purpose import ProcessingPurposeRepository
from app.services.processing_process import ProcessingProcessService


class ProcessingContextProvider:
    def __init__(self, db: Session) -> None:
        self.service = ProcessingProcessService(
            ProcessingProcessRepository(db),
            IspdnRepository(db),
            ProcessingPurposeRepository(db),
        )

    def get_context(self, ispdn_id: int) -> dict:
        return self.service.get_document_context(ispdn_id).model_dump()
