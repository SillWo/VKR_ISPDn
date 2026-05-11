from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.schemas.text import strip_optional_text, strip_required_text

DataCenterOwnerType = Literal[
    "individual",
    "foreign_organization",
    "individual_entrepreneur",
    "legal_entity",
]

OWNER_FIELDS = (
    "owner_organization_type",
    "owner_person_full_name",
    "owner_organization_name",
    "owner_ogrnip",
    "owner_ogrn",
    "owner_inn",
    "owner_location_country",
    "owner_location_address",
)


class DataCenterBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    location_country: str = Field(min_length=1, max_length=255)
    location_address: str = Field(min_length=1, max_length=1000)
    is_own_data_center: bool
    owner_organization_type: DataCenterOwnerType | None = None
    owner_person_full_name: str | None = Field(default=None, max_length=255)
    owner_organization_name: str | None = Field(default=None, max_length=255)
    owner_ogrnip: str | None = Field(default=None, max_length=64)
    owner_ogrn: str | None = Field(default=None, max_length=64)
    owner_inn: str | None = Field(default=None, max_length=64)
    owner_location_country: str | None = Field(default=None, max_length=255)
    owner_location_address: str | None = Field(default=None, max_length=1000)

    _validate_required_text = field_validator(
        "name",
        "location_country",
        "location_address",
        mode="before",
    )(strip_required_text)
    _normalize_optional_text = field_validator(
        "owner_person_full_name",
        "owner_organization_name",
        "owner_ogrnip",
        "owner_ogrn",
        "owner_inn",
        "owner_location_country",
        "owner_location_address",
        mode="before",
    )(strip_optional_text)

    @field_validator("owner_organization_type", mode="before")
    @classmethod
    def normalize_owner_organization_type(cls, value: object) -> object:
        if isinstance(value, str) and not value.strip():
            return None
        return value

    @model_validator(mode="after")
    def validate_owner_fields(self) -> "DataCenterBase":
        if self.is_own_data_center:
            for field in OWNER_FIELDS:
                setattr(self, field, None)
            return self

        if self.owner_organization_type is None:
            raise ValueError("Owner organization type is required for third-party data center")
        self._require("owner_location_country")
        self._require("owner_location_address")

        if self.owner_organization_type == "individual":
            self._require("owner_person_full_name")
            self._require("owner_inn")
            self.owner_organization_name = None
            self.owner_ogrnip = None
            self.owner_ogrn = None
        elif self.owner_organization_type == "individual_entrepreneur":
            self._require("owner_person_full_name")
            self._require("owner_ogrnip")
            self._require("owner_inn")
            self.owner_organization_name = None
            self.owner_ogrn = None
        elif self.owner_organization_type == "legal_entity":
            self._require("owner_organization_name")
            self._require("owner_ogrn")
            self._require("owner_inn")
            self.owner_person_full_name = None
            self.owner_ogrnip = None
        elif self.owner_organization_type == "foreign_organization":
            self._require("owner_organization_name")
            self.owner_person_full_name = None
            self.owner_ogrnip = None
            self.owner_ogrn = None
            self.owner_inn = None

        return self

    def _require(self, field_name: str) -> None:
        if getattr(self, field_name) is None:
            raise ValueError(f"{field_name} is required")


class DataCenterCreate(DataCenterBase):
    pass


class DataCenterUpdate(DataCenterBase):
    pass


class DataCenterRead(DataCenterBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class DataCenterListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    location_country: str
    location_address: str
    is_own_data_center: bool
    owner_organization_type: DataCenterOwnerType | None
    owner_display_name: str
    created_at: datetime
    updated_at: datetime


class DataCenterOption(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    location_country: str
    location_address: str
    is_own_data_center: bool
    owner_display_name: str


class IspdnDataCentersUpdate(BaseModel):
    data_center_ids: list[int] = []

    @field_validator("data_center_ids")
    @classmethod
    def deduplicate_ids(cls, value: list[int]) -> list[int]:
        return list(dict.fromkeys(value))
