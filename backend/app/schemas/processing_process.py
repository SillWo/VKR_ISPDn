from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.domain.processing_catalogs import (
    DATA_CATEGORY_CATALOG,
    INTERNAL_NETWORK_TRANSFER_LABELS,
    INTERNET_TRANSFER_LABELS,
    LEGAL_BASIS_CATALOG,
    PERSONAL_DATA_ACTION_CATALOG,
    PROCESSING_TYPE_LABELS,
    SUBJECT_CATEGORY_CATALOG,
    InternalNetworkTransfer,
    InternetTransfer,
    ProcessingType,
    get_catalog_keys,
)
from app.schemas.text import strip_required_text


def validate_switch_group(value: Any, allowed_keys: set[str], field_name: str) -> dict[str, bool]:
    if not isinstance(value, dict):
        raise ValueError(f"{field_name} must be an object")

    unknown_keys = set(value) - allowed_keys
    if unknown_keys:
        keys = ", ".join(sorted(unknown_keys))
        raise ValueError(f"{field_name} contains unknown keys: {keys}")

    normalized: dict[str, bool] = {}
    for key in allowed_keys:
        raw_value = value.get(key, False)
        if not isinstance(raw_value, bool):
            raise ValueError(f"{field_name}.{key} must be boolean")
        normalized[key] = raw_value

    if not any(normalized.values()):
        raise ValueError(f"{field_name} must contain at least one selected value")

    return normalized


def validate_personal_data_action_group(value: Any) -> dict[str, bool | str]:
    if not isinstance(value, dict):
        raise ValueError("personal_data_actions must be an object")

    allowed_keys = get_catalog_keys(PERSONAL_DATA_ACTION_CATALOG)
    unknown_keys = set(value) - allowed_keys
    if unknown_keys:
        keys = ", ".join(sorted(unknown_keys))
        raise ValueError(f"personal_data_actions contains unknown keys: {keys}")

    normalized: dict[str, bool | str] = {}
    has_selected_action = False
    for key in allowed_keys:
        raw_value = value.get(key, "" if key == "other_actions" else False)
        if key == "other_actions":
            if raw_value is None:
                raw_value = ""
            if not isinstance(raw_value, str):
                raise ValueError("personal_data_actions.other_actions must be string")
            normalized[key] = raw_value.strip()
            has_selected_action = has_selected_action or bool(raw_value.strip())
            continue
        if not isinstance(raw_value, bool):
            raise ValueError(f"personal_data_actions.{key} must be boolean")
        normalized[key] = raw_value
        has_selected_action = has_selected_action or raw_value

    if not has_selected_action:
        raise ValueError("personal_data_actions must contain at least one selected value")

    return normalized


def validate_data_category_group(value: Any) -> dict[str, bool | str]:
    if not isinstance(value, dict):
        raise ValueError("data_categories must be an object")

    allowed_keys = get_catalog_keys(DATA_CATEGORY_CATALOG)
    text_keys = {"other_personal_data", "other_biometric_data"}
    unknown_keys = set(value) - allowed_keys
    if unknown_keys:
        keys = ", ".join(sorted(unknown_keys))
        raise ValueError(f"data_categories contains unknown keys: {keys}")

    normalized: dict[str, bool | str] = {}
    has_selected_category = False
    for key in allowed_keys:
        raw_value = value.get(key, "" if key in text_keys else False)
        if key in text_keys:
            if raw_value is None:
                raw_value = ""
            if not isinstance(raw_value, str):
                raise ValueError(f"data_categories.{key} must be string")
            normalized[key] = raw_value.strip()
            has_selected_category = has_selected_category or bool(raw_value.strip())
            continue
        if not isinstance(raw_value, bool):
            raise ValueError(f"data_categories.{key} must be boolean")
        normalized[key] = raw_value
        has_selected_category = has_selected_category or raw_value

    if not has_selected_category:
        raise ValueError("data_categories must contain at least one selected value")

    return normalized


class ProcessingProcessBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    purpose_name: str = Field(min_length=1, max_length=255)
    processing_period: str = Field(min_length=1, max_length=1000)
    subject_categories: dict[str, bool]
    data_categories: dict[str, bool | str]
    legal_bases: dict[str, bool]
    personal_data_actions: dict[str, bool | str]
    processing_type: ProcessingType
    internal_network_transfer: InternalNetworkTransfer
    internet_transfer: InternetTransfer
    cross_border_transfer: bool

    _validate_required_text = field_validator(
        "name",
        "purpose_name",
        "processing_period",
        mode="before",
    )(strip_required_text)

    @field_validator("subject_categories", mode="before")
    @classmethod
    def validate_subject_categories(cls, value: Any) -> dict[str, bool]:
        return validate_switch_group(value, get_catalog_keys(SUBJECT_CATEGORY_CATALOG), "subject_categories")

    @field_validator("data_categories", mode="before")
    @classmethod
    def validate_data_categories(cls, value: Any) -> dict[str, bool | str]:
        return validate_data_category_group(value)

    @field_validator("legal_bases", mode="before")
    @classmethod
    def validate_legal_bases(cls, value: Any) -> dict[str, bool]:
        return validate_switch_group(value, get_catalog_keys(LEGAL_BASIS_CATALOG), "legal_bases")

    @field_validator("personal_data_actions", mode="before")
    @classmethod
    def validate_personal_data_actions(cls, value: Any) -> dict[str, bool | str]:
        return validate_personal_data_action_group(value)


class ProcessingProcessCreate(ProcessingProcessBase):
    pass


class ProcessingProcessUpdate(ProcessingProcessBase):
    pass


class IspdnProcessingProcessLinkCreate(BaseModel):
    processing_process_id: int = Field(gt=0)


class ProcessingProcessLinkedIspdn(BaseModel):
    id: int
    name: str
    status: str


class ProcessingProcessRead(ProcessingProcessBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    process_signature: str
    linked_ispdns: list[ProcessingProcessLinkedIspdn] = []
    linked_ispdns_count: int = 0
    created_at: datetime
    updated_at: datetime


class ProcessingProcessListItem(ProcessingProcessRead):
    pass


class ProcessingProcessOption(BaseModel):
    id: int
    name: str
    purpose_name: str
    processing_period: str


class ProcessingProcessRegistryItem(BaseModel):
    id: int
    name: str
    purpose_name: str
    processing_period: str
    linked_ispdns_count: int
    linked_ispdns: list[ProcessingProcessLinkedIspdn]
    created_at: datetime
    updated_at: datetime


class ProcessPurposePeriod(BaseModel):
    purpose_name: str
    processing_period: str


class ProcessingProcessDocumentItem(BaseModel):
    id: int
    name: str
    purpose_name: str
    processing_period: str
    subject_categories: list[str]
    data_categories: list[str]
    legal_bases: list[str]
    personal_data_actions: list[str]
    processing_methods: dict[str, str | bool]


class ProcessingProcessDocumentContext(BaseModel):
    ispdn_id: int
    processes: list[ProcessingProcessDocumentItem]
    processing_purpose_periods: list[ProcessPurposePeriod]


ALLOWED_PROCESSING_TYPE_VALUES = set(PROCESSING_TYPE_LABELS)
ALLOWED_INTERNAL_NETWORK_TRANSFER_VALUES = set(INTERNAL_NETWORK_TRANSFER_LABELS)
ALLOWED_INTERNET_TRANSFER_VALUES = set(INTERNET_TRANSFER_LABELS)
