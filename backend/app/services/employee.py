from app.models.employee import Employee
from app.repositories.department import DepartmentRepository
from app.repositories.employee import EmployeeRepository
from app.schemas.employee import EmployeeCreate, EmployeeUpdate


class EmployeeNotFoundError(Exception):
    pass


class EmployeeDepartmentNotFoundError(Exception):
    pass


class EmployeeInUseError(Exception):
    pass


class EmployeeService:
    def __init__(
        self,
        repository: EmployeeRepository,
        department_repository: DepartmentRepository,
    ) -> None:
        self.repository = repository
        self.department_repository = department_repository

    def list_employees(self, organization_id: int) -> list[Employee]:
        return self.repository.list(organization_id)

    def list_employee_options(self, organization_id: int) -> list[Employee]:
        return self.repository.list(organization_id)

    def get_employee(self, employee_id: int, organization_id: int) -> Employee:
        employee = self.repository.get_by_id(employee_id, organization_id)
        if employee is None:
            raise EmployeeNotFoundError
        return employee

    def create_employee(self, payload: EmployeeCreate, organization_id: int) -> Employee:
        self._validate_department(payload.department_id, organization_id)
        return self.repository.create(payload, organization_id)

    def update_employee(self, employee_id: int, payload: EmployeeUpdate, organization_id: int) -> Employee:
        employee = self.get_employee(employee_id, organization_id)
        self._validate_department(payload.department_id, organization_id)
        return self.repository.update(employee, payload)

    def delete_employee(self, employee_id: int, organization_id: int) -> None:
        employee = self.get_employee(employee_id, organization_id)
        if self.repository.is_used_in_ispdn_cards(employee_id, organization_id):
            raise EmployeeInUseError
        self.repository.delete(employee)

    def _validate_department(self, department_id: int | None, organization_id: int) -> None:
        if department_id is None:
            return
        if self.department_repository.get_by_id(department_id, organization_id) is None:
            raise EmployeeDepartmentNotFoundError
