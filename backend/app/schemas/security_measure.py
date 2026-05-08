from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, field_validator

TechnicalMeasureRegulatoryStatus = Literal["base_set", "not_base_set"]
TechnicalMeasureFactualStatus = Literal["implemented", "not_implemented"]


class IspdnSecurityToolsBase(BaseModel):
    dlp: bool = False
    siem: bool = False
    antivirus: bool = False
    ips_ids: bool = False
    firewall_utm_ngfw: bool = False
    vulnerability_scanner: bool = False
    backup_system: bool = False
    trusted_boot: bool = False
    access_control: bool = False
    physical_security: bool = False
    other_security_tools: str | None = None

    @field_validator("other_security_tools", mode="before")
    @classmethod
    def normalize_other_security_tools(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if not isinstance(value, str):
            return value
        stripped = value.strip()
        return stripped or None


class IspdnSecurityToolsUpsert(IspdnSecurityToolsBase):
    pass


class IspdnSecurityToolsRead(IspdnSecurityToolsBase):
    model_config = ConfigDict(from_attributes=True)


class TechnicalSecurityMeasureUpdate(BaseModel):
    factual_status: TechnicalMeasureFactualStatus
    comment: str | None = None

    @field_validator("comment", mode="before")
    @classmethod
    def normalize_comment(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if not isinstance(value, str):
            return value
        stripped = value.strip()
        return stripped or None


class TechnicalSecurityMeasureRead(BaseModel):
    code: str
    section_code: str
    section_title: str
    content: str
    security_level: int
    regulatory_status: TechnicalMeasureRegulatoryStatus
    regulatory_status_label: str
    factual_status: TechnicalMeasureFactualStatus
    factual_status_label: str
    comment_required: bool
    comment: str | None
    has_comment: bool
    updated_at: datetime | None


class TechnicalSecurityMeasuresSummary(BaseModel):
    total_count: int
    base_set_count: int
    not_base_set_count: int
    implemented_count: int
    not_implemented_count: int
    base_set_implemented_count: int
    base_set_not_implemented_count: int
    base_set_rejected_count: int
    comment_required_count: int
    comment_not_required_count: int
    missing_required_comment_count: int


class TechnicalSecurityMeasuresTableRead(BaseModel):
    ispdn_id: int
    recommended_level: int
    actual_level: int
    actual_level_matches_recommended: bool
    items: list[TechnicalSecurityMeasureRead]
    summary: TechnicalSecurityMeasuresSummary


class TechnicalSecurityMeasureDocumentContext(BaseModel):
    code: str
    section_code: str
    section_title: str
    content: str
    regulatory_status: TechnicalMeasureRegulatoryStatus
    regulatory_status_label: str
    factual_status: TechnicalMeasureFactualStatus
    factual_status_label: str
    comment_required: bool
    comment: str | None
    has_comment: bool
    justification_required: bool
    justification_text: str | None


class TechnicalSecurityMeasureDocumentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ispdn_id: int
    file_name: str
    file_content_type: str
    file_size_bytes: int
    created_at: datetime
