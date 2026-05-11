from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.text import strip_optional_text, strip_required_text


class RknAccessPersonManualData(BaseModel):
    model_config = ConfigDict(extra="forbid")

    person_type: Literal["individual", "individual_entrepreneur", "legal_entity", "foreign_organization"]
    name: str = Field(min_length=1)
    address: str = Field(min_length=1)
    email: str | None = None
    phone: str | None = None

    _validate_required_text = field_validator("name", "address", mode="before")(strip_required_text)
    _validate_optional_text = field_validator("email", "phone", mode="before")(strip_optional_text)


class RknNotificationManualData(BaseModel):
    model_config = ConfigDict(extra="forbid")

    rkn_access_persons: list[RknAccessPersonManualData] = Field(default_factory=list)
