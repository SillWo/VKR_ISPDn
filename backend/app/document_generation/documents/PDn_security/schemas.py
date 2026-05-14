from pydantic import BaseModel, ConfigDict, Field, field_validator


class PdnSecurityManualData(BaseModel):
    model_config = ConfigDict(extra="forbid")

    order_number: str = Field(..., min_length=1)

    @field_validator("order_number")
    @classmethod
    def validate_order_number(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("Укажите номер приказа")
        return trimmed
