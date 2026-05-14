from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.employee import Employee
from app.models.ispdn import IspdnCard
from app.schemas.employee import EmployeeCreate, EmployeeUpdate


class EmployeeRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self, organization_id: int) -> list[Employee]:
        statement = (
            select(Employee)
            .options(joinedload(Employee.department))
            .where(Employee.organization_id == organization_id)
            .order_by(Employee.full_name.asc())
        )
        return list(self.db.scalars(statement).all())

    def get_by_id(self, employee_id: int, organization_id: int) -> Employee | None:
        statement = (
            select(Employee)
            .options(joinedload(Employee.department))
            .where(Employee.id == employee_id, Employee.organization_id == organization_id)
        )
        return self.db.scalars(statement).first()

    def create(self, payload: EmployeeCreate, organization_id: int) -> Employee:
        employee = Employee(**payload.model_dump(), organization_id=organization_id)
        self.db.add(employee)
        self.db.commit()
        self.db.refresh(employee)
        return self.get_by_id(employee.id, organization_id) or employee

    def update(self, employee: Employee, payload: EmployeeUpdate) -> Employee:
        for field, value in payload.model_dump().items():
            setattr(employee, field, value)
        self.db.commit()
        self.db.refresh(employee)
        return self.get_by_id(employee.id, employee.organization_id) or employee

    def delete(self, employee: Employee) -> None:
        self.db.delete(employee)
        self.db.commit()

    def is_used_in_ispdn_cards(self, employee_id: int, organization_id: int) -> bool:
        statement = select(IspdnCard.id).where(
            IspdnCard.responsible_employee_id == employee_id,
            IspdnCard.organization_id == organization_id,
        ).limit(1)
        return self.db.scalars(statement).first() is not None

    def rollback(self) -> None:
        self.db.rollback()
