from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.text import strip_required_text


class ActIspdnCommissioningEvent(BaseModel):
    model_config = ConfigDict(extra="forbid")

    event_name: str = Field(min_length=1)
    responsible_employee_id: int

    _validate_required_text = field_validator("event_name", mode="before")(strip_required_text)


class ActIspdnCommissioningManualData(BaseModel):
    model_config = ConfigDict(extra="forbid")

    description_of_violations_and_disadvantages: str = Field(min_length=1)
    recommendation: str = Field(min_length=1)
    events: list[ActIspdnCommissioningEvent] = Field(min_length=1)

    _validate_required_text = field_validator(
        "description_of_violations_and_disadvantages",
        "recommendation",
        mode="before",
    )(strip_required_text)
