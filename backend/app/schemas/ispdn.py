from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.schemas.employee import EmployeeShortRead
from app.schemas.data_center import DataCenterOption
from app.schemas.security_measure import IspdnSecurityToolsRead, IspdnSecurityToolsUpsert
from app.schemas.text import strip_required_text

IspdnStatus = Literal["active", "archived"]


class IspdnBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    short_description: str = Field(min_length=1)
    commissioning_date: date
    decommissioning_date: date | None = None
    website_url: str | None = Field(default=None, max_length=2048)
    system_composition: str = Field(min_length=1)
    status: IspdnStatus = "active"

    _validate_required_text = field_validator(
        "name",
        "short_description",
        "system_composition",
        mode="before",
    )(strip_required_text)

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
    security_tools: IspdnSecurityToolsUpsert | None = None


class IspdnUpdate(IspdnBase):
    responsible_employee_id: int
    security_tools: IspdnSecurityToolsUpsert | None = None


class IspdnRead(IspdnBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    responsible_person: str
    responsible_employee_id: int | None
    responsible_employee: EmployeeShortRead | None = None
    data_centers: list[DataCenterOption] = []
    security_tools: IspdnSecurityToolsRead = Field(default_factory=IspdnSecurityToolsRead)
    created_at: datetime
    updated_at: datetime

    @field_validator("security_tools", mode="before")
    @classmethod
    def default_security_tools(cls, value):
        return value or IspdnSecurityToolsRead()


class IspdnListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    short_description: str
    status: IspdnStatus
    responsible_person: str
    responsible_employee_id: int | None
    responsible_employee: EmployeeShortRead | None = None
    commissioning_date: date
    decommissioning_date: date | None
    updated_at: datetime
