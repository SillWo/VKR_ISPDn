from datetime import date, datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.schemas.employee import EmployeeShortRead
from app.schemas.text import strip_optional_text, strip_required_text


PHONE_PATTERN = r"^\+7\(\d{3}\)\d{3}-\d{2}-\d{2}$"
EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
OrganizationTerminationType = Literal["end_date", "end_condition"]
IdentityDocumentType = Literal["passport_rf", "other_rf_document"]


class OrganizationOperatorType(str, Enum):
    legal_entity = "legal_entity"
    individual_entrepreneur = "individual_entrepreneur"
    state_body = "state_body"
    municipal_body = "municipal_body"
    branch = "branch"
    foreign_citizen = "foreign_citizen"


class OrganizationOkvedUpsert(BaseModel):
    code: str = Field(min_length=1, max_length=32)
    name: str = Field(min_length=1)

    _validate_required_text = field_validator("code", "name", mode="before")(strip_required_text)


class OrganizationOkvedRead(OrganizationOkvedUpsert):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sort_order: int


class OrganizationBranchUpsert(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    postal_address: str = Field(min_length=1)

    _validate_required_text = field_validator("name", "postal_address", mode="before")(strip_required_text)


class OrganizationBranchRead(OrganizationBranchUpsert):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sort_order: int


class OrganizationBase(BaseModel):
    short_legal_name: str | None = Field(default=None, max_length=255)
    full_legal_name: str = Field(min_length=1)
    inn: str = Field(min_length=10, max_length=12, pattern=r"^\d+$")
    ogrn: str = Field(min_length=13, max_length=15, pattern=r"^\d+$")
    kpp: str | None = Field(default=None, min_length=9, max_length=9, pattern=r"^\d+$")
    head_employee_id: int | None = None
    registration_address: str = Field(min_length=1)
    registration_city: str = Field(min_length=1, max_length=255)
    operator_type: OrganizationOperatorType | None = None
    identity_document_type: IdentityDocumentType | None = None
    identity_document_name: str | None = Field(default=None, max_length=255)
    identity_document_series: str | None = Field(default=None, max_length=32, pattern=r"^\d+$")
    identity_document_number: str | None = Field(default=None, max_length=32, pattern=r"^\d+$")
    identity_document_issued_by: str | None = None
    identity_document_issued_date: date | None = None
    head_office_region: str | None = Field(default=None, max_length=255)
    activity_regions: str | None = None
    rkn_office_address: str | None = None
    postal_address_matches_registration: bool = True
    postal_address: str | None = None
    phone: str | None = Field(default=None, pattern=PHONE_PATTERN)
    fax: str | None = Field(default=None, pattern=PHONE_PATTERN)
    email: str | None = Field(default=None, max_length=255, pattern=EMAIL_PATTERN)
    okpo: str | None = Field(default=None, max_length=32)
    okfs: str | None = Field(default=None, max_length=32)
    okogu: str | None = Field(default=None, max_length=32)
    okopf: str | None = Field(default=None, max_length=32)
    document_approver_employee_id: int | None = None
    information_security_responsible_employee_id: int | None = None
    personal_data_processing_responsible_employee_id: int | None = None
    personal_data_processing_termination_type: OrganizationTerminationType | None = None
    personal_data_processing_termination_date: date | None = None
    personal_data_processing_termination_condition: str | None = None
    okveds: list[OrganizationOkvedUpsert] = Field(default_factory=list)
    branches: list[OrganizationBranchUpsert] = Field(default_factory=list)

    _validate_required_text = field_validator(
        "full_legal_name",
        "inn",
        "ogrn",
        "registration_address",
        "registration_city",
        mode="before",
    )(strip_required_text)

    _validate_optional_text = field_validator(
        "short_legal_name",
        "identity_document_name",
        "identity_document_series",
        "identity_document_number",
        "identity_document_issued_by",
        "kpp",
        "head_office_region",
        "activity_regions",
        "rkn_office_address",
        "postal_address",
        "phone",
        "fax",
        "email",
        "okpo",
        "okfs",
        "okogu",
        "okopf",
        "personal_data_processing_termination_condition",
        mode="before",
    )(strip_optional_text)

    @model_validator(mode="after")
    def validate_postal_address(self) -> "OrganizationBase":
        if self.postal_address_matches_registration:
            self.postal_address = None
        elif self.postal_address is None:
            raise ValueError("Postal address is required when it differs from registration address")
        return self

    @model_validator(mode="after")
    def validate_processing_termination(self) -> "OrganizationBase":
        if self.personal_data_processing_termination_type is None:
            return self

        if self.personal_data_processing_termination_type == "end_date":
            if self.personal_data_processing_termination_date is None:
                raise ValueError("Termination date is required")
            self.personal_data_processing_termination_condition = None
            return self

        if self.personal_data_processing_termination_condition is None:
            raise ValueError("Termination condition is required")
        self.personal_data_processing_termination_date = None
        return self


class OrganizationUpsert(OrganizationBase):
    @model_validator(mode="after")
    def validate_operator_fields(self) -> "OrganizationUpsert":
        if self.operator_type in {
            OrganizationOperatorType.legal_entity,
            OrganizationOperatorType.state_body,
            OrganizationOperatorType.municipal_body,
        }:
            if self.short_legal_name is None:
                raise ValueError("Short legal name is required")
            if len(self.inn) != 10:
                raise ValueError("INN must contain 10 digits for legal entity")
            if len(self.ogrn) != 13:
                raise ValueError("OGRN must contain 13 digits for legal entity")
            if self.kpp is None:
                raise ValueError("KPP is required for legal entity")
            return self

        if self.operator_type == OrganizationOperatorType.individual_entrepreneur:
            if len(self.inn) != 12:
                raise ValueError("INN must contain 12 digits for individual entrepreneur")
            if len(self.ogrn) != 15:
                raise ValueError("OGRNIP must contain 15 digits for individual entrepreneur")
            self.kpp = None
            missing_identity_fields = (
                self.identity_document_type is None
                or self.identity_document_series is None
                or self.identity_document_number is None
                or self.identity_document_issued_by is None
                or self.identity_document_issued_date is None
            )
            if missing_identity_fields:
                raise ValueError("Identity document data is required")
            if self.identity_document_type == "other_rf_document" and self.identity_document_name is None:
                raise ValueError("Identity document name is required")
        return self

    @model_validator(mode="after")
    def validate_head_employee(self) -> "OrganizationUpsert":
        if self.head_employee_id is None:
            raise ValueError("Head employee is required")
        if self.personal_data_processing_termination_type is None:
            raise ValueError("Termination type is required")
        if self.rkn_office_address is None:
            raise ValueError("RKN office address is required")
        return self


class OrganizationRead(OrganizationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    okveds: list[OrganizationOkvedRead] = Field(default_factory=list)
    branches: list[OrganizationBranchRead] = Field(default_factory=list)
    head_employee: EmployeeShortRead | None = None
    document_approver_employee: EmployeeShortRead | None = None
    information_security_responsible_employee: EmployeeShortRead | None = None
    personal_data_processing_responsible_employee: EmployeeShortRead | None = None
    created_at: datetime
    updated_at: datetime


class OrganizationReadinessRead(BaseModel):
    is_ready_for_ispdn_creation: bool
    message: str | None = None
