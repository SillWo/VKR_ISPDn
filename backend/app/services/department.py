from sqlalchemy.exc import IntegrityError

from app.models.department import Department
from app.repositories.department import DepartmentRepository
from app.schemas.department import DepartmentCreate, DepartmentUpdate


class DepartmentNotFoundError(Exception):
    pass


class DepartmentNameConflictError(Exception):
    pass


class DepartmentService:
    def __init__(self, repository: DepartmentRepository) -> None:
        self.repository = repository

    def list_departments(self) -> list[Department]:
        return self.repository.list()

    def get_department(self, department_id: int) -> Department:
        department = self.repository.get_by_id(department_id)
        if department is None:
            raise DepartmentNotFoundError
        return department

    def create_department(self, payload: DepartmentCreate) -> Department:
        try:
            return self.repository.create(payload)
        except IntegrityError as exc:
            self.repository.rollback()
            raise DepartmentNameConflictError from exc

    def update_department(self, department_id: int, payload: DepartmentUpdate) -> Department:
        department = self.get_department(department_id)
        try:
            return self.repository.update(department, payload)
        except IntegrityError as exc:
            self.repository.rollback()
            raise DepartmentNameConflictError from exc

    def delete_department(self, department_id: int) -> None:
        department = self.get_department(department_id)
        self.repository.delete(department)
