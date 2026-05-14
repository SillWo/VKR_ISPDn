from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.repositories.department import DepartmentRepository
from app.schemas.department import DepartmentCreate, DepartmentRead, DepartmentUpdate
from app.services.department import (
    DepartmentNameConflictError,
    DepartmentNotFoundError,
    DepartmentService,
)

router = APIRouter(prefix="/departments", tags=["departments"])


def get_department_service(db: Session = Depends(get_db)) -> DepartmentService:
    return DepartmentService(DepartmentRepository(db))


@router.get("", response_model=list[DepartmentRead])
def list_departments(
    service: DepartmentService = Depends(get_department_service),
    current_user: User = Depends(get_current_user),
):
    return service.list_departments(current_user.organization_id)


@router.post("", response_model=DepartmentRead, status_code=status.HTTP_201_CREATED)
def create_department(
    payload: DepartmentCreate,
    service: DepartmentService = Depends(get_department_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.create_department(payload, current_user.organization_id)
    except DepartmentNameConflictError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Department with this name already exists",
        ) from exc


@router.get("/{department_id}", response_model=DepartmentRead)
def get_department(
    department_id: int,
    service: DepartmentService = Depends(get_department_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.get_department(department_id, current_user.organization_id)
    except DepartmentNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found") from exc


@router.put("/{department_id}", response_model=DepartmentRead)
def update_department(
    department_id: int,
    payload: DepartmentUpdate,
    service: DepartmentService = Depends(get_department_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.update_department(department_id, payload, current_user.organization_id)
    except DepartmentNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found") from exc
    except DepartmentNameConflictError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Department with this name already exists",
        ) from exc


@router.delete("/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_department(
    department_id: int,
    service: DepartmentService = Depends(get_department_service),
    current_user: User = Depends(get_current_user),
):
    try:
        service.delete_department(department_id, current_user.organization_id)
    except DepartmentNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found") from exc
