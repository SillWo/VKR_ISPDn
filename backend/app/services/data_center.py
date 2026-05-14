from typing import TYPE_CHECKING

from app.models.data_center import DataCenter
from app.repositories.data_center import DataCenterRepository
from app.schemas.data_center import DataCenterCreate, DataCenterUpdate, IspdnDataCentersUpdate

if TYPE_CHECKING:
    from app.services.task_automation import TaskAutomationService


class DataCenterNotFoundError(Exception):
    pass


class DataCenterInUseError(Exception):
    pass


class DataCenterIspdnNotFoundError(Exception):
    pass


class DataCenterLinkedItemNotFoundError(Exception):
    pass


class DataCenterService:
    def __init__(
        self,
        repository: DataCenterRepository,
        task_automation_service: "TaskAutomationService | None" = None,
    ) -> None:
        self.repository = repository
        self.task_automation_service = task_automation_service

    def list_data_centers(self, organization_id: int) -> list[DataCenter]:
        return self.repository.list(organization_id)

    def list_options(self, organization_id: int) -> list[DataCenter]:
        return self.repository.list_options(organization_id)

    def get_data_center(self, data_center_id: int, organization_id: int) -> DataCenter:
        data_center = self.repository.get_by_id(data_center_id, organization_id)
        if data_center is None:
            raise DataCenterNotFoundError
        return data_center

    def create_data_center(self, payload: DataCenterCreate, organization_id: int) -> DataCenter:
        return self.repository.create(payload, organization_id)

    def update_data_center(self, data_center_id: int, payload: DataCenterUpdate, organization_id: int) -> DataCenter:
        data_center = self.get_data_center(data_center_id, organization_id)
        return self.repository.update(data_center, payload)

    def delete_data_center(self, data_center_id: int, organization_id: int) -> None:
        data_center = self.get_data_center(data_center_id, organization_id)
        if self.repository.count_ispdn_links(data_center_id, organization_id) > 0:
            raise DataCenterInUseError
        self.repository.delete(data_center)

    def list_for_ispdn(self, ispdn_id: int, organization_id: int) -> list[DataCenter]:
        self._get_ispdn(ispdn_id, organization_id)
        return self.repository.list_for_ispdn(ispdn_id, organization_id)

    def set_for_ispdn(self, ispdn_id: int, payload: IspdnDataCentersUpdate, organization_id: int) -> list[DataCenter]:
        ispdn = self._get_ispdn(ispdn_id, organization_id)
        self._ensure_data_centers_exist(payload.data_center_ids, organization_id)
        old_data_center_ids = {data_center.id for data_center in self.repository.list_for_ispdn(ispdn_id, organization_id)}
        is_active = ispdn.status == "active"
        data_centers = self.repository.set_for_ispdn(ispdn, payload.data_center_ids)

        if is_active and self.task_automation_service is not None:
            new_data_center_ids = set(payload.data_center_ids)
            added_data_center_ids = sorted(new_data_center_ids - old_data_center_ids)
            if added_data_center_ids:
                self.task_automation_service.create_data_center_added_events(ispdn_id, added_data_center_ids, organization_id)

        return data_centers

    def _get_ispdn(self, ispdn_id: int, organization_id: int):
        ispdn = self.repository.get_ispdn_by_id(ispdn_id, organization_id)
        if ispdn is None:
            raise DataCenterIspdnNotFoundError
        return ispdn

    def _ensure_data_centers_exist(self, data_center_ids: list[int], organization_id: int) -> None:
        if not data_center_ids:
            return
        if self.repository.count_existing_ids(data_center_ids, organization_id) != len(data_center_ids):
            raise DataCenterLinkedItemNotFoundError
