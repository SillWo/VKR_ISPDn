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

    def list_employees(self) -> list[Employee]:
        return self.repository.list()

    def list_employee_options(self) -> list[Employee]:
        return self.repository.list()

    def get_employee(self, employee_id: int) -> Employee:
        employee = self.repository.get_by_id(employee_id)
        if employee is None:
            raise EmployeeNotFoundError
        return employee

    def create_employee(self, payload: EmployeeCreate) -> Employee:
        self._validate_department(payload.department_id)
        return self.repository.create(payload)

    def update_employee(self, employee_id: int, payload: EmployeeUpdate) -> Employee:
        employee = self.get_employee(employee_id)
        self._validate_department(payload.department_id)
        return self.repository.update(employee, payload)

    def delete_employee(self, employee_id: int) -> None:
        employee = self.get_employee(employee_id)
        if self.repository.is_used_in_ispdn_cards(employee_id):
            raise EmployeeInUseError
        self.repository.delete(employee)

    def _validate_department(self, department_id: int | None) -> None:
        if department_id is None:
            return
        if self.department_repository.get_by_id(department_id) is None:
            raise EmployeeDepartmentNotFoundError
