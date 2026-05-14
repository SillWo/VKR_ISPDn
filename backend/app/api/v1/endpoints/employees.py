from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.repositories.department import DepartmentRepository
from app.repositories.employee import EmployeeRepository
from app.schemas.employee import EmployeeCreate, EmployeeListItem, EmployeeRead, EmployeeShortRead, EmployeeUpdate
from app.services.employee import (
    EmployeeDepartmentNotFoundError,
    EmployeeInUseError,
    EmployeeNotFoundError,
    EmployeeService,
)

router = APIRouter(prefix="/employees", tags=["employees"])


def get_employee_service(db: Session = Depends(get_db)) -> EmployeeService:
    return EmployeeService(EmployeeRepository(db), DepartmentRepository(db))


@router.get("", response_model=list[EmployeeListItem])
def list_employees(
    service: EmployeeService = Depends(get_employee_service),
    current_user: User = Depends(get_current_user),
):
    return service.list_employees(current_user.organization_id)


@router.post("", response_model=EmployeeRead, status_code=status.HTTP_201_CREATED)
def create_employee(
    payload: EmployeeCreate,
    service: EmployeeService = Depends(get_employee_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.create_employee(payload, current_user.organization_id)
    except EmployeeDepartmentNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found") from exc


@router.get("/options", response_model=list[EmployeeShortRead])
def list_employee_options(
    service: EmployeeService = Depends(get_employee_service),
    current_user: User = Depends(get_current_user),
):
    return service.list_employee_options(current_user.organization_id)


@router.get("/{employee_id}", response_model=EmployeeRead)
def get_employee(
    employee_id: int,
    service: EmployeeService = Depends(get_employee_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.get_employee(employee_id, current_user.organization_id)
    except EmployeeNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found") from exc


@router.put("/{employee_id}", response_model=EmployeeRead)
def update_employee(
    employee_id: int,
    payload: EmployeeUpdate,
    service: EmployeeService = Depends(get_employee_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.update_employee(employee_id, payload, current_user.organization_id)
    except EmployeeNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found") from exc
    except EmployeeDepartmentNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found") from exc


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(
    employee_id: int,
    service: EmployeeService = Depends(get_employee_service),
    current_user: User = Depends(get_current_user),
):
    try:
        service.delete_employee(employee_id, current_user.organization_id)
    except EmployeeNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found") from exc
    except EmployeeInUseError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Employee is used in ISPDn cards and cannot be deleted",
        ) from exc
