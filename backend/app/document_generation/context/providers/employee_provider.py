from typing import Literal

from sqlalchemy.orm import Session

from app.document_generation.core.errors import DocumentEmployeeNotFoundError
from app.repositories.employee import EmployeeRepository

EmployeeNameMode = Literal["full_name", "document_initials"]


class EmployeeContextProvider:
    def __init__(self, db: Session) -> None:
        self.repository = EmployeeRepository(db)

    def get_employee_name(self, employee_id: int, mode: EmployeeNameMode) -> str:
        employee = self.repository.get_by_id(employee_id)
        if employee is None:
            raise DocumentEmployeeNotFoundError(f"Employee not found: {employee_id}")
        if mode == "full_name":
            return employee.full_name
        return employee.document_initials
