from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.text import strip_required_text


class ProcessingPurposeBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    processing_period: str = Field(min_length=1, max_length=1000)

    _validate_required_text = field_validator("name", "processing_period", mode="before")(strip_required_text)


class ProcessingPurposeCreate(ProcessingPurposeBase):
    pass


class ProcessingPurposeUpdate(ProcessingPurposeBase):
    pass


class ProcessingPurposeRead(ProcessingPurposeBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class ProcessingPurposeOption(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    processing_period: str
