"""Data access package."""
from app.repositories.department import DepartmentRepository
from app.repositories.employee import EmployeeRepository
from app.repositories.ispdn import IspdnRepository

__all__ = ["DepartmentRepository", "EmployeeRepository", "IspdnRepository"]
