from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.department import Department
from app.schemas.department import DepartmentCreate, DepartmentUpdate


class DepartmentRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self) -> list[Department]:
        statement = select(Department).order_by(Department.name.asc())
        return list(self.db.scalars(statement).all())

    def get_by_id(self, department_id: int) -> Department | None:
        return self.db.get(Department, department_id)

    def create(self, payload: DepartmentCreate) -> Department:
        department = Department(**payload.model_dump())
        self.db.add(department)
        self.db.commit()
        self.db.refresh(department)
        return department

    def update(self, department: Department, payload: DepartmentUpdate) -> Department:
        for field, value in payload.model_dump().items():
            setattr(department, field, value)
        self.db.commit()
        self.db.refresh(department)
        return department

    def delete(self, department: Department) -> None:
        self.db.delete(department)
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()
