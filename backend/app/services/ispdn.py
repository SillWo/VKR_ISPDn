from app.models.ispdn import IspdnCard
from app.repositories.employee import EmployeeRepository
from app.repositories.ispdn import IspdnRepository
from app.schemas.ispdn import IspdnCreate, IspdnUpdate


class IspdnNotFoundError(Exception):
    pass


class IspdnResponsibleEmployeeNotFoundError(Exception):
    pass


class IspdnService:
    def __init__(self, repository: IspdnRepository, employee_repository: EmployeeRepository) -> None:
        self.repository = repository
        self.employee_repository = employee_repository

    def list_cards(self) -> list[IspdnCard]:
        return self.repository.list()

    def get_card(self, ispdn_id: int) -> IspdnCard:
        card = self.repository.get_by_id(ispdn_id)
        if card is None:
            raise IspdnNotFoundError
        return card

    def create_card(self, payload: IspdnCreate) -> IspdnCard:
        employee = self.employee_repository.get_by_id(payload.responsible_employee_id)
        if employee is None:
            raise IspdnResponsibleEmployeeNotFoundError
        return self.repository.create(payload, responsible_person=employee.full_name)

    def update_card(self, ispdn_id: int, payload: IspdnUpdate) -> IspdnCard:
        card = self.get_card(ispdn_id)
        employee = self.employee_repository.get_by_id(payload.responsible_employee_id)
        if employee is None:
            raise IspdnResponsibleEmployeeNotFoundError
        return self.repository.update(card, payload, responsible_person=employee.full_name)
