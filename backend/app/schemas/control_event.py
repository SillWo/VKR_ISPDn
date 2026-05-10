from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.text import strip_required_text


class ControlEventBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)

    _validate_required_text = field_validator("name", "description", mode="before")(strip_required_text)


class ControlEventCreate(ControlEventBase):
    pass


class ControlEventUpdate(ControlEventBase):
    pass


class ControlEventFileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    control_event_id: int
    file_name: str
    file_content_type: str
    file_size_bytes: int
    created_at: datetime


class ControlEventRead(ControlEventBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    files: list[ControlEventFileRead]
    created_at: datetime
    updated_at: datetime


class ControlEventOption(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str
