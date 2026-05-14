from typing import Literal

from sqlalchemy.orm import Session

from app.document_generation.core.errors import DocumentEmployeeNotFoundError
from app.repositories.employee import EmployeeRepository

EmployeeNameMode = Literal["full_name", "document_initials"]


class EmployeeContextProvider:
    def __init__(self, db: Session, organization_id: int) -> None:
        self.organization_id = organization_id
        self.repository = EmployeeRepository(db)

    def get_employee_name(self, employee_id: int, mode: EmployeeNameMode) -> str:
        employee = self.repository.get_by_id(employee_id, self.organization_id)
        if employee is None:
            raise DocumentEmployeeNotFoundError(f"Employee not found: {employee_id}")
        if mode == "full_name":
            return employee.full_name
        return employee.document_initials

    def get_employee_document_context(self, employee_id: int) -> dict:
        employee = self.repository.get_by_id(employee_id, self.organization_id)
        if employee is None:
            raise DocumentEmployeeNotFoundError(f"Employee not found: {employee_id}")
        return {
            "id": employee.id,
            "full_name": employee.full_name,
            "document_initials": employee.document_initials,
            "position": employee.position,
        }

    def get_employee_document_info(self, employee_id: int) -> dict:
        employee = self.repository.get_by_id(employee_id, self.organization_id)
        if employee is None:
            raise DocumentEmployeeNotFoundError(f"Employee not found: {employee_id}")
        return {
            "name": employee.document_initials,
            "position": employee.position,
        }
