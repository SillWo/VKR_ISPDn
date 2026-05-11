from datetime import datetime
import re

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.department import DepartmentShortRead
from app.schemas.text import strip_optional_text, strip_required_text

PHONE_NUMBER_PATTERN = r"^\+7 \(\d{3}\) \d{3} \d{2} \d{2}$"
EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


class EmployeeBase(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    position: str = Field(min_length=1, max_length=255)
    document_initials: str = Field(min_length=1, max_length=255)
    phone_number: str | None = Field(default=None, max_length=32)
    email: str | None = Field(default=None, max_length=255)
    department_id: int | None = None

    _validate_required_text = field_validator("full_name", "position", "document_initials", mode="before")(
        strip_required_text,
    )
    _normalize_optional_text = field_validator("phone_number", "email", mode="before")(strip_optional_text)

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, value: str | None) -> str | None:
        if value is not None and not re.fullmatch(PHONE_NUMBER_PATTERN, value):
            raise ValueError("Phone number must match +7 (999) 999 99 99")
        return value

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str | None) -> str | None:
        if value is not None and not re.fullmatch(EMAIL_PATTERN, value):
            raise ValueError("Email must be valid")
        return value


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
    phone_number: str | None = None
    email: str | None = None
    department_id: int | None = None
    department_name: str | None = None
