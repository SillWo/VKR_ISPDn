from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class OrganizationBase(BaseModel):
    short_legal_name: str = Field(min_length=1, max_length=255)
    full_legal_name: str = Field(min_length=1)
    inn: str = Field(min_length=10, max_length=10, pattern=r"^\d+$")
    ogrn: str = Field(min_length=13, max_length=13, pattern=r"^\d+$")
    kpp: str = Field(min_length=9, max_length=9, pattern=r"^\d+$")
    head_full_name: str = Field(min_length=1, max_length=255)
    head_position: str = Field(min_length=1, max_length=255)
    registration_address: str = Field(min_length=1)
    registration_city: str = Field(min_length=1, max_length=255)

    @field_validator(
        "short_legal_name",
        "full_legal_name",
        "inn",
        "ogrn",
        "kpp",
        "head_full_name",
        "head_position",
        "registration_address",
        "registration_city",
        mode="before",
    )
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        if not isinstance(value, str) or not value.strip():
            raise ValueError("Field cannot be empty")
        return value.strip()


class OrganizationUpsert(OrganizationBase):
    pass


class OrganizationRead(OrganizationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
