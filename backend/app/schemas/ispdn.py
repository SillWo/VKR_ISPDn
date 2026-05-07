from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.schemas.employee import EmployeeShortRead

IspdnStatus = Literal["active", "archived"]


class IspdnBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    short_description: str = Field(min_length=1)
    processing_purposes: str = Field(min_length=1)
    commissioning_date: date
    decommissioning_date: date | None = None
    website_url: str | None = Field(default=None, max_length=2048)
    system_composition: str = Field(min_length=1)
    status: IspdnStatus = "active"

    @field_validator(
        "name",
        "short_description",
        "processing_purposes",
        "system_composition",
        mode="before",
    )
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        if not isinstance(value, str) or not value.strip():
            raise ValueError("Field cannot be empty")
        return value.strip()

    @field_validator("website_url", mode="before")
    @classmethod
    def normalize_optional_url(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if isinstance(value, str) and not value.strip():
            return None
        return value.strip() if isinstance(value, str) else value

    @model_validator(mode="after")
    def validate_decommissioning_date(self) -> "IspdnBase":
        if self.decommissioning_date and self.decommissioning_date < self.commissioning_date:
            raise ValueError("Decommissioning date cannot be earlier than commissioning date")
        return self


class IspdnCreate(IspdnBase):
    responsible_employee_id: int


class IspdnUpdate(IspdnBase):
    responsible_employee_id: int


class IspdnRead(IspdnBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    responsible_person: str
    responsible_employee_id: int | None
    responsible_employee: EmployeeShortRead | None = None
    created_at: datetime
    updated_at: datetime


class IspdnListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    short_description: str
    status: IspdnStatus
    responsible_person: str
    responsible_employee_id: int | None
    responsible_employee: EmployeeShortRead | None = None
    processing_purposes: str
    commissioning_date: date
    decommissioning_date: date | None
    updated_at: datetime
