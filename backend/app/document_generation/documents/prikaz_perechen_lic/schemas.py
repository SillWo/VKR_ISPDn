from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.schemas.text import strip_required_text


class PrikazPerechenLicAccessPerson(BaseModel):
    model_config = ConfigDict(extra="forbid")

    employee_id: int = Field(gt=0)


class PrikazPerechenLicManualData(BaseModel):
    model_config = ConfigDict(extra="forbid")

    order_number: str = Field(min_length=1)
    access_persons: list[PrikazPerechenLicAccessPerson] = Field(min_length=1)

    _validate_order_number = field_validator("order_number", mode="before")(strip_required_text)

    @model_validator(mode="after")
    def validate_unique_employee_ids(self) -> "PrikazPerechenLicManualData":
        employee_ids = [person.employee_id for person in self.access_persons]
        if len(employee_ids) != len(set(employee_ids)):
            raise ValueError("access_persons must not contain duplicate employee_id values")
        return self
