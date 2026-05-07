from pydantic import BaseModel, ConfigDict, Field, field_validator


class ActIspdnCommissioningEvent(BaseModel):
    model_config = ConfigDict(extra="forbid")

    event_name: str = Field(min_length=1)
    responsible_employee_id: int

    @field_validator("event_name", mode="before")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        if not isinstance(value, str) or not value.strip():
            raise ValueError("Field cannot be empty")
        return value.strip()


class ActIspdnCommissioningManualData(BaseModel):
    model_config = ConfigDict(extra="forbid")

    description_of_violations_and_disadvantages: str = Field(min_length=1)
    recommendation: str = Field(min_length=1)
    events: list[ActIspdnCommissioningEvent] = Field(min_length=1)

    @field_validator("description_of_violations_and_disadvantages", "recommendation", mode="before")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        if not isinstance(value, str) or not value.strip():
            raise ValueError("Field cannot be empty")
        return value.strip()
