from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.schemas.text import strip_required_text

CryptoToolClass = Literal["KS1", "KS2", "KS3", "KV", "KA"]


class CryptoToolBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    crypto_class: CryptoToolClass
    manufacturer: str = Field(min_length=1, max_length=255)
    serial_number: str = Field(min_length=1, max_length=255)

    _validate_required_text = field_validator(
        "name",
        "manufacturer",
        "serial_number",
        mode="before",
    )(strip_required_text)


class CryptoToolCreate(CryptoToolBase):
    pass


class CryptoToolUpdate(CryptoToolBase):
    pass


class CryptoToolRead(CryptoToolBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class CryptoToolListItem(CryptoToolRead):
    pass


class CryptoToolOption(CryptoToolBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class IspdnCryptographyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ispdn_id: int
    uses_cryptography: bool
    crypto_tools: list[CryptoToolOption] = Field(default_factory=list)


class IspdnCryptographyUpdate(BaseModel):
    uses_cryptography: bool
    crypto_tool_ids: list[int] = Field(default_factory=list)

    @field_validator("crypto_tool_ids")
    @classmethod
    def deduplicate_ids(cls, value: list[int]) -> list[int]:
        return list(dict.fromkeys(value))

    @model_validator(mode="after")
    def validate_crypto_tools(self) -> "IspdnCryptographyUpdate":
        if not self.uses_cryptography:
            self.crypto_tool_ids = []
            return self

        if not self.crypto_tool_ids:
            raise ValueError("At least one crypto tool is required when cryptography is used")
        return self
