from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.department import DepartmentShortRead
from app.schemas.text import strip_required_text


class EmployeeBase(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    position: str = Field(min_length=1, max_length=255)
    document_initials: str = Field(min_length=1, max_length=255)
    department_id: int | None = None

    _validate_required_text = field_validator("full_name", "position", "document_initials", mode="before")(
        strip_required_text,
    )


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(EmployeeBase):
    pass


class EmployeeRead(EmployeeBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    department: DepartmentShortRead | None = None
    created_at: datetime
    updated_at: datetime


class EmployeeListItem(EmployeeRead):
    pass


class EmployeeShortRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    position: str
    document_initials: str
    department_id: int | None = None
    department_name: str | None = None
