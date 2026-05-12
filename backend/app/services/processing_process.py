from typing import TYPE_CHECKING, Any

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
from app.domain.processing_process_signature import build_processing_process_signature
from app.domain.processing_process_subsumption import filter_subsumed_processing_processes
from app.models.processing_process import ProcessingProcess
from app.repositories.ispdn import IspdnRepository
from app.repositories.processing_process import ProcessingProcessRepository
from app.schemas.processing_process import (
    IspdnProcessingProcessLinkCreate,
    ProcessingProcessCreate,
    ProcessingProcessDocumentContext,
    ProcessingProcessDocumentItem,
    ProcessingProcessLinkedIspdn,
    ProcessingProcessListItem,
    ProcessingProcessOption,
    ProcessingProcessRead,
    ProcessingProcessRegistryItem,
    ProcessingProcessUpdate,
    ProcessPurposePeriod,
)
from app.services.ispdn import IspdnNotFoundError

if TYPE_CHECKING:
    from app.services.task_automation import TaskAutomationService


class ProcessingProcessNotFoundError(Exception):
    pass


class ProcessingProcessInUseError(Exception):
    pass


class ProcessingProcessAlreadyLinkedError(Exception):
    pass


class ProcessingProcessLinkedItemNotFoundError(Exception):
    pass


class ProcessingProcessService:
    def __init__(
        self,
        repository: ProcessingProcessRepository,
        ispdn_repository: IspdnRepository,
        task_automation_service: "TaskAutomationService | None" = None,
    ) -> None:
        self.repository = repository
        self.ispdn_repository = ispdn_repository
        self.task_automation_service = task_automation_service

    def list_registry(self) -> list[ProcessingProcessRegistryItem]:
        return [self._to_registry_item(process) for process in self.repository.list_registry()]

    def list_options(self) -> list[ProcessingProcessOption]:
        return [self._to_option(process) for process in self.repository.list_options()]

    def list_unique_for_active_ispdns(self) -> list[ProcessingProcessListItem]:
        processes = self.repository.list_unique_for_active_ispdns()
        return [self._to_read(process) for process in filter_subsumed_processing_processes(processes)]

    def get_registry_process(self, process_id: int) -> ProcessingProcessRead:
        return self._to_read(self._get_process(process_id))

    def create_registry_process(self, payload: ProcessingProcessCreate) -> ProcessingProcessRead:
        process = self._find_or_create_process(payload)
        return self._to_read(process)

    def update_registry_process(self, process_id: int, payload: ProcessingProcessUpdate) -> ProcessingProcessRead:
        process = self._get_process(process_id)
        if self.repository.count_linked_ispdns(process_id) > 0:
            raise ProcessingProcessInUseError

        values = self._payload_values(payload)
        process_signature = build_processing_process_signature(values)
        existing = self.repository.get_by_signature(process_signature)
        if existing is not None and existing.id != process_id:
            return self._to_read(existing)

        return self._to_read(self.repository.update(process, values, process_signature))

    def delete_registry_process(self, process_id: int) -> None:
        process = self._get_process(process_id)
        if self.repository.count_linked_ispdns(process_id) > 0:
            raise ProcessingProcessInUseError
        self.repository.delete(process)

    def list_processes_for_ispdn(self, ispdn_id: int) -> list[ProcessingProcessListItem]:
        self._ensure_ispdn_exists(ispdn_id)
        return [self._to_read(process) for process in self.repository.list_by_ispdn(ispdn_id)]

    def create_and_link_process_to_ispdn(
        self,
        ispdn_id: int,
        payload: ProcessingProcessCreate,
    ) -> ProcessingProcessRead:
        self._ensure_ispdn_exists(ispdn_id)
        process, was_created = self._find_or_create_process_with_created_flag(payload)
        self.repository.link_to_ispdn(ispdn_id, process.id)
        if was_created and self.task_automation_service is not None:
            self.task_automation_service.create_processing_process_created_events(process.id)
        return self._to_read(self.repository.get_by_id(process.id) or process)

    def link_existing_process_to_ispdn(
        self,
        ispdn_id: int,
        payload: IspdnProcessingProcessLinkCreate,
    ) -> ProcessingProcessRead:
        self._ensure_ispdn_exists(ispdn_id)
        process = self._get_process(payload.processing_process_id)
        had_active_links = bool(self.repository.list_active_ispdns_for_process(process.id))
        self.repository.link_to_ispdn(ispdn_id, process.id)
        if not had_active_links and self.task_automation_service is not None:
            self.task_automation_service.create_processing_process_created_events(process.id)
        return self._to_read(self.repository.get_by_id(process.id) or process)

    def update_process_for_ispdn(
        self,
        ispdn_id: int,
        process_id: int,
        payload: ProcessingProcessUpdate,
    ) -> ProcessingProcessRead:
        self._ensure_link_exists(ispdn_id, process_id)
        values = self._payload_values(payload)
        process_signature = build_processing_process_signature(values)
        new_process = self.repository.get_by_signature(process_signature)
        was_created = False
        if new_process is None:
            new_process = self.repository.create(values, process_signature)
            was_created = True

        self.repository.replace_link_for_ispdn(ispdn_id, process_id, new_process.id)
        if was_created and self.task_automation_service is not None:
            self.task_automation_service.create_processing_process_created_events(new_process.id)
        return self._to_read(self.repository.get_by_id(new_process.id) or new_process)

    def unlink_process_from_ispdn(self, ispdn_id: int, process_id: int) -> None:
        self._ensure_link_exists(ispdn_id, process_id)
        self.repository.unlink_from_ispdn(ispdn_id, process_id)

    def get_document_context(self, ispdn_id: int) -> ProcessingProcessDocumentContext:
        processes = self.list_processes_for_ispdn(ispdn_id)
        document_items = [self._to_document_item(process) for process in processes]
        return ProcessingProcessDocumentContext(
            ispdn_id=ispdn_id,
            processes=document_items,
            processing_purpose_periods=[
                ProcessPurposePeriod(
                    purpose_name=process.purpose_name,
                    processing_period=process.processing_period,
                )
                for process in processes
            ],
        )

    def _find_or_create_process(self, payload: ProcessingProcessCreate) -> ProcessingProcess:
        process, _was_created = self._find_or_create_process_with_created_flag(payload)
        return process

    def _find_or_create_process_with_created_flag(
        self,
        payload: ProcessingProcessCreate,
    ) -> tuple[ProcessingProcess, bool]:
        values = self._payload_values(payload)
        process_signature = build_processing_process_signature(values)
        existing = self.repository.get_by_signature(process_signature)
        if existing is not None:
            return existing, False
        return self.repository.create(values, process_signature), True

    @staticmethod
    def _payload_values(payload: ProcessingProcessCreate | ProcessingProcessUpdate) -> dict[str, Any]:
        values = payload.model_dump()
        values["name"] = values["purpose_name"]
        return values

    def _get_process(self, process_id: int) -> ProcessingProcess:
        process = self.repository.get_by_id(process_id)
        if process is None:
            raise ProcessingProcessNotFoundError
        return process

    def _ensure_ispdn_exists(self, ispdn_id: int) -> None:
        if self.ispdn_repository.get_by_id(ispdn_id) is None:
            raise IspdnNotFoundError

    def _ensure_link_exists(self, ispdn_id: int, process_id: int) -> None:
        self._ensure_ispdn_exists(ispdn_id)
        if self.repository.get_by_id(process_id) is None:
            raise ProcessingProcessNotFoundError
        if not self.repository.is_linked_to_ispdn(ispdn_id, process_id):
            raise ProcessingProcessLinkedItemNotFoundError

    def _to_read(self, process: ProcessingProcess | ProcessingProcessListItem) -> ProcessingProcessListItem:
        if isinstance(process, ProcessingProcessListItem):
            return process
        linked_ispdns = [self._to_linked_ispdn(card) for card in getattr(process, "ispdn_cards", [])]
        return ProcessingProcessListItem(
            id=process.id,
            name=process.purpose_name,
            purpose_name=process.purpose_name,
            processing_period=process.processing_period,
            subject_categories=process.subject_categories,
            data_categories=process.data_categories,
            legal_bases=process.legal_bases,
            personal_data_actions=process.personal_data_actions,
            processing_type=process.processing_type,
            internal_network_transfer=process.internal_network_transfer,
            internet_transfer=process.internet_transfer,
            cross_border_transfer=process.cross_border_transfer,
            process_signature=process.process_signature,
            linked_ispdns=linked_ispdns,
            linked_ispdns_count=len(linked_ispdns),
            created_at=process.created_at,
            updated_at=process.updated_at,
        )

    def _to_registry_item(self, process: ProcessingProcess) -> ProcessingProcessRegistryItem:
        linked_ispdns = [self._to_linked_ispdn(card) for card in process.ispdn_cards]
        return ProcessingProcessRegistryItem(
            id=process.id,
            name=process.purpose_name,
            purpose_name=process.purpose_name,
            processing_period=process.processing_period,
            linked_ispdns_count=len(linked_ispdns),
            linked_ispdns=linked_ispdns,
            created_at=process.created_at,
            updated_at=process.updated_at,
        )

    @staticmethod
    def _to_option(process: ProcessingProcess) -> ProcessingProcessOption:
        return ProcessingProcessOption(
            id=process.id,
            name=process.purpose_name,
            purpose_name=process.purpose_name,
            processing_period=process.processing_period,
        )

    @staticmethod
    def _to_linked_ispdn(card) -> ProcessingProcessLinkedIspdn:
        return ProcessingProcessLinkedIspdn(id=card.id, name=card.name, status=card.status)

    @staticmethod
    def _to_document_item(process: ProcessingProcessListItem) -> ProcessingProcessDocumentItem:
        return ProcessingProcessDocumentItem(
            id=process.id,
            name=process.purpose_name,
            purpose_name=process.purpose_name,
            processing_period=process.processing_period,
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
