from app.models.data_center import DataCenter
from app.repositories.data_center import DataCenterRepository
from app.schemas.data_center import DataCenterCreate, DataCenterUpdate, IspdnDataCentersUpdate


class DataCenterNotFoundError(Exception):
    pass


class DataCenterInUseError(Exception):
    pass


class DataCenterIspdnNotFoundError(Exception):
    pass


class DataCenterLinkedItemNotFoundError(Exception):
    pass


class DataCenterService:
    def __init__(self, repository: DataCenterRepository) -> None:
        self.repository = repository

    def list_data_centers(self) -> list[DataCenter]:
        return self.repository.list()

    def list_options(self) -> list[DataCenter]:
        return self.repository.list_options()

    def get_data_center(self, data_center_id: int) -> DataCenter:
        data_center = self.repository.get_by_id(data_center_id)
        if data_center is None:
            raise DataCenterNotFoundError
        return data_center

    def create_data_center(self, payload: DataCenterCreate) -> DataCenter:
        return self.repository.create(payload)

    def update_data_center(self, data_center_id: int, payload: DataCenterUpdate) -> DataCenter:
        data_center = self.get_data_center(data_center_id)
        return self.repository.update(data_center, payload)

    def delete_data_center(self, data_center_id: int) -> None:
        data_center = self.get_data_center(data_center_id)
        if self.repository.count_ispdn_links(data_center_id) > 0:
            raise DataCenterInUseError
        self.repository.delete(data_center)

    def list_for_ispdn(self, ispdn_id: int) -> list[DataCenter]:
        self._get_ispdn(ispdn_id)
        return self.repository.list_for_ispdn(ispdn_id)

    def set_for_ispdn(self, ispdn_id: int, payload: IspdnDataCentersUpdate) -> list[DataCenter]:
        ispdn = self._get_ispdn(ispdn_id)
        self._ensure_data_centers_exist(payload.data_center_ids)
        return self.repository.set_for_ispdn(ispdn, payload.data_center_ids)

    def _get_ispdn(self, ispdn_id: int):
        ispdn = self.repository.get_ispdn_by_id(ispdn_id)
        if ispdn is None:
            raise DataCenterIspdnNotFoundError
        return ispdn

    def _ensure_data_centers_exist(self, data_center_ids: list[int]) -> None:
        if not data_center_ids:
            return
        if self.repository.count_existing_ids(data_center_ids) != len(data_center_ids):
            raise DataCenterLinkedItemNotFoundError
