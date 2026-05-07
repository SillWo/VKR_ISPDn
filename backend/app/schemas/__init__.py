"""Pydantic schemas package."""
from app.schemas.department import DepartmentCreate, DepartmentRead, DepartmentUpdate
from app.schemas.employee import EmployeeCreate, EmployeeListItem, EmployeeRead, EmployeeShortRead, EmployeeUpdate
from app.schemas.ispdn import IspdnCreate, IspdnListItem, IspdnRead, IspdnUpdate

__all__ = [
    "DepartmentCreate",
    "DepartmentRead",
    "DepartmentUpdate",
    "EmployeeCreate",
    "EmployeeListItem",
    "EmployeeRead",
    "EmployeeShortRead",
    "EmployeeUpdate",
    "IspdnCreate",
    "IspdnListItem",
    "IspdnRead",
    "IspdnUpdate",
]
