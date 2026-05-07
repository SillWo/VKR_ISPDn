from app.domain.processing_catalogs import (
    DATA_CATEGORY_CATALOG,
    INTERNAL_NETWORK_TRANSFER_LABELS,
    INTERNET_TRANSFER_LABELS,
    LEGAL_BASIS_CATALOG,
    PERSONAL_DATA_ACTION_CATALOG,
    PROCESSING_TYPE_LABELS,
    SUBJECT_CATEGORY_CATALOG,
    selected_labels,
)
from app.models.processing_process import ProcessingProcess
from app.repositories.ispdn import IspdnRepository
from app.repositories.processing_process import ProcessingProcessRepository
from app.repositories.processing_purpose import ProcessingPurposeRepository
from app.schemas.processing_process import (
    ProcessingProcessCreate,
    ProcessingProcessDocumentContext,
    ProcessingProcessDocumentItem,
    ProcessingProcessDocumentPurpose,
    ProcessingProcessUpdate,
)
from app.services.ispdn import IspdnNotFoundError
from app.services.processing_purpose import ProcessingPurposeNotFoundError


class ProcessingProcessNotFoundError(Exception):
    pass


class ProcessingProcessService:
    def __init__(
        self,
        repository: ProcessingProcessRepository,
        ispdn_repository: IspdnRepository,
        purpose_repository: ProcessingPurposeRepository,
    ) -> None:
        self.repository = repository
        self.ispdn_repository = ispdn_repository
        self.purpose_repository = purpose_repository

    def list_processes(self, ispdn_id: int) -> list[ProcessingProcess]:
        self._ensure_ispdn_exists(ispdn_id)
        return self.repository.list_by_ispdn(ispdn_id)

    def get_process(self, ispdn_id: int, process_id: int) -> ProcessingProcess:
        self._ensure_ispdn_exists(ispdn_id)
        process = self.repository.get_for_ispdn(ispdn_id, process_id)
        if process is None:
            raise ProcessingProcessNotFoundError
        return process

    def create_process(self, ispdn_id: int, payload: ProcessingProcessCreate) -> ProcessingProcess:
        self._ensure_ispdn_exists(ispdn_id)
        self._ensure_purpose_exists(payload.processing_purpose_id)
        return self.repository.create(ispdn_id, payload)

    def update_process(self, ispdn_id: int, process_id: int, payload: ProcessingProcessUpdate) -> ProcessingProcess:
        process = self.get_process(ispdn_id, process_id)
        self._ensure_purpose_exists(payload.processing_purpose_id)
        return self.repository.update(process, payload)

    def delete_process(self, ispdn_id: int, process_id: int) -> None:
        process = self.get_process(ispdn_id, process_id)
        self.repository.delete(process)

    def get_document_context(self, ispdn_id: int) -> ProcessingProcessDocumentContext:
        processes = self.list_processes(ispdn_id)
        return ProcessingProcessDocumentContext(
            ispdn_id=ispdn_id,
            processes=[self._to_document_item(process) for process in processes],
        )

    def _ensure_ispdn_exists(self, ispdn_id: int) -> None:
        if self.ispdn_repository.get_by_id(ispdn_id) is None:
            raise IspdnNotFoundError

    def _ensure_purpose_exists(self, purpose_id: int) -> None:
        if self.purpose_repository.get_by_id(purpose_id) is None:
            raise ProcessingPurposeNotFoundError

    def _to_document_item(self, process: ProcessingProcess) -> ProcessingProcessDocumentItem:
        return ProcessingProcessDocumentItem(
            id=process.id,
            purpose=ProcessingProcessDocumentPurpose(
                id=process.processing_purpose.id,
                name=process.processing_purpose.name,
                processing_period=process.processing_purpose.processing_period,
            ),
            subject_categories=selected_labels(process.subject_categories, SUBJECT_CATEGORY_CATALOG),
            data_categories=selected_labels(process.data_categories, DATA_CATEGORY_CATALOG),
            legal_bases=selected_labels(process.legal_bases, LEGAL_BASIS_CATALOG),
            personal_data_actions=selected_labels(process.personal_data_actions, PERSONAL_DATA_ACTION_CATALOG),
            processing_methods={
                "processing_type": PROCESSING_TYPE_LABELS[process.processing_type],
                "internal_network_transfer": INTERNAL_NETWORK_TRANSFER_LABELS[process.internal_network_transfer],
                "internet_transfer": INTERNET_TRANSFER_LABELS[process.internet_transfer],
                "cross_border_transfer": process.cross_border_transfer,
            },
        )
