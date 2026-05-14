from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.text import strip_required_text


class PdnDocumentManualData(BaseModel):
    model_config = ConfigDict(extra="forbid")

    order_number: str = Field(min_length=1)

    _validate_order_number = field_validator("order_number", mode="before")(strip_required_text)
