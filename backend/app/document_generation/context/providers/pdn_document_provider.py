from datetime import date
from typing import Any

from sqlalchemy.orm import Session

from app.document_generation.core.errors import DocumentPrerequisiteMissingError
from app.domain.processing_catalogs import (
    DATA_CATEGORY_CATALOG,
    PERSONAL_DATA_ACTION_CATALOG,
    SUBJECT_CATEGORY_CATALOG,
    selected_labels,
)
from app.domain.processing_process_subsumption import filter_subsumed_processing_processes_by_name
from app.models.organization import OrganizationCard
from app.models.processing_process import ProcessingProcess
from app.repositories.ispdn import IspdnRepository
from app.repositories.organization import OrganizationRepository
from app.repositories.processing_process import ProcessingProcessRepository
from app.services.organization import OrganizationNotFoundError, OrganizationService


def _text(value: object) -> str:
    if value is None:
        return ""
    return str(value)


def _strip(value: object) -> str:
    return _text(value).strip()


def _join(values: list[str]) -> str:
    return "; ".join(value for value in values if value)


def _append_unique(target: list[str], seen: set[str], values: list[str]) -> None:
    for value in values:
        normalized = value.strip()
        if normalized and normalized not in seen:
            target.append(normalized)
            seen.add(normalized)


class PdnDocumentContextProvider:
    def __init__(self, db: Session, organization_id: int) -> None:
        self.organization_id = organization_id
        self.organization_service = OrganizationService(OrganizationRepository(db))
        self.ispdn_repository = IspdnRepository(db)
        self.processing_repository = ProcessingProcessRepository(db)

    def get_context(self, manual_data: dict) -> dict:
        try:
            organization = self.organization_service.get_card(self.organization_id)
        except OrganizationNotFoundError as exc:
            raise DocumentPrerequisiteMissingError("Карточка организации не заполнена.") from exc

        self._validate_organization(organization)

        active_ispdns = self.ispdn_repository.list(self.organization_id, status="active")
        if not active_ispdns:
            raise DocumentPrerequisiteMissingError(
                'Для формирования положения об обработке ПДн нужна хотя бы одна ИСПДн со статусом "Работает".',
            )

        processes = self.processing_repository.list_unique_for_active_ispdns(self.organization_id)
        if not processes:
            raise DocumentPrerequisiteMissingError(
                "Для формирования положения об обработке ПДн у действующих ИСПДн должен быть указан хотя бы один процесс обработки.",
            )

        generation_date = date.today()
        filtered_processes = filter_subsumed_processing_processes_by_name(processes)

        return {
            "order_number": manual_data["order_number"],
            "date": generation_date.strftime("%d.%m.%Y"),
            "org_city": organization.registration_city,
            "org_full_name": organization.full_legal_name,
            "main_post": organization.head_position,
            "main_FIO": self._head_full_name(organization),
            "year": generation_date.strftime("%Y"),
            "pdn_policy_subject_categories": self._unique_labels(
                processes,
                "subject_categories",
                SUBJECT_CATEGORY_CATALOG,
            ),
            "pdn_policy_data_categories": self._unique_labels(processes, "data_categories", DATA_CATEGORY_CATALOG),
            "pdn_policy_processing_processes": [
                self._processing_process_context(index, process)
                for index, process in enumerate(filtered_processes, start=1)
            ],
        }

    def _validate_organization(self, organization: OrganizationCard) -> None:
        if not _strip(organization.head_position):
            raise DocumentPrerequisiteMissingError("В карточке организации не указана должность руководителя.")
        if not _strip(organization.head_full_name) and organization.head_employee is None:
            raise DocumentPrerequisiteMissingError("В карточке организации не указан руководитель организации.")

    def _head_full_name(self, organization: OrganizationCard) -> str:
        if organization.head_employee is not None:
            return organization.head_employee.full_name
        return _strip(organization.head_full_name)

    def _unique_labels(
        self,
        processes: list[ProcessingProcess],
        field_name: str,
        catalog: list[dict[str, str]],
    ) -> list[str]:
        result: list[str] = []
        seen: set[str] = set()
        for process in processes:
            _append_unique(result, seen, selected_labels(getattr(process, field_name), catalog))
        return result

    def _processing_process_context(self, number: int, process: ProcessingProcess) -> dict[str, Any]:
        return {
            "number": number,
            "process_name": process.purpose_name,
            "personal_data_categories": _join(selected_labels(process.data_categories, DATA_CATEGORY_CATALOG)),
            "processing_period": process.processing_period,
            "personal_data_actions": _join(
                selected_labels(process.personal_data_actions, PERSONAL_DATA_ACTION_CATALOG),
            ),
        }
