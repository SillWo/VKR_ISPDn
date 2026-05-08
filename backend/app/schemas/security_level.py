from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.domain.security_level_algorithm import (
    DATA_CATEGORY_KEYS,
    SECURITY_LEVEL_VALUES,
    SUBJECT_COUNT_RANGE_VALUES,
    SUBJECT_GROUP_VALUES,
    THREAT_TYPE_VALUES,
    SubjectCountRange,
    SubjectGroup,
    ThreatType,
)


class SecurityLevelDataCategories(BaseModel):
    model_config = ConfigDict(extra="forbid")

    special: bool = False
    biometric: bool = False
    public: bool = False
    other: bool = False

    @model_validator(mode="after")
    def validate_at_least_one_category(self) -> "SecurityLevelDataCategories":
        if not any(self.model_dump().values()):
            raise ValueError("data_categories must contain at least one selected value")
        return self


class SecurityLevelBase(BaseModel):
    data_categories: SecurityLevelDataCategories
    subject_count_range: SubjectCountRange
    threat_type: ThreatType
    subject_group: SubjectGroup


class SecurityLevelUpsert(SecurityLevelBase):
    actual_level: int = Field(ge=1, le=4)
    deviation_justification_text: str | None = None

    @field_validator("deviation_justification_text", mode="before")
    @classmethod
    def normalize_justification_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if not isinstance(value, str):
            return value
        stripped = value.strip()
        return stripped or None


class SecurityLevelRead(SecurityLevelBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ispdn_id: int
    primary_data_category: str
    threat_type: str
    employee_only: bool
    recommended_level: int
    actual_level: int
    actual_level_matches_recommended: bool
    deviation_justification_text: str | None
    deviation_justification_file_name: str | None
    created_at: datetime
    updated_at: datetime

    @field_validator("data_categories", mode="before")
    @classmethod
    def parse_data_categories(cls, value: Any) -> SecurityLevelDataCategories | dict[str, bool]:
        if isinstance(value, SecurityLevelDataCategories):
            return value
        if isinstance(value, dict):
            return {key: bool(value.get(key, False)) for key in DATA_CATEGORY_KEYS}
        return value


class SecurityLevelCalculationResult(BaseModel):
    primary_data_category: str
    threat_type: ThreatType
    employee_only: bool
    recommended_level: int


class SecurityLevelDocumentContext(BaseModel):
    ispdn_id: int
    data_categories: list[str]
    primary_data_category: str
    subject_count_range: str
    threat_type: str
    subject_group: str
    employee_only: bool
    recommended_level: int
    actual_level: int
    actual_level_matches_recommended: bool
    deviation_justification_text: str | None
    deviation_justification_file_name: str | None


ALLOWED_SECURITY_LEVEL_DATA_CATEGORY_KEYS = set(DATA_CATEGORY_KEYS)
ALLOWED_SUBJECT_COUNT_RANGE_VALUES = set(SUBJECT_COUNT_RANGE_VALUES)
ALLOWED_SUBJECT_GROUP_VALUES = set(SUBJECT_GROUP_VALUES)
ALLOWED_THREAT_TYPE_VALUES = set(THREAT_TYPE_VALUES)
ALLOWED_SECURITY_LEVEL_VALUES = set(SECURITY_LEVEL_VALUES)
