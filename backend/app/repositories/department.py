from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.department import Department
from app.schemas.department import DepartmentCreate, DepartmentUpdate


class DepartmentRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self, organization_id: int) -> list[Department]:
        statement = select(Department).where(Department.organization_id == organization_id).order_by(Department.name.asc())
        return list(self.db.scalars(statement).all())

    def get_by_id(self, department_id: int, organization_id: int) -> Department | None:
        statement = select(Department).where(
            Department.id == department_id,
            Department.organization_id == organization_id,
        )
        return self.db.scalars(statement).first()

    def create(self, payload: DepartmentCreate, organization_id: int) -> Department:
        department = Department(**payload.model_dump(), organization_id=organization_id)
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
