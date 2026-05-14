from datetime import date

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.document_generation.documents.RKN_notification.schemas import RknAccessPersonManualData


class RknNotificationChangesManualData(BaseModel):
    model_config = ConfigDict(extra="forbid")

    change_date: date
    main_office_reg: str = Field(..., min_length=1)
    rkn_access_persons: list[RknAccessPersonManualData] = Field(default_factory=list)

    @field_validator("main_office_reg")
    @classmethod
    def validate_main_office_reg(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("Укажите регистрационный номер организации в реестре РКН")
        return trimmed
