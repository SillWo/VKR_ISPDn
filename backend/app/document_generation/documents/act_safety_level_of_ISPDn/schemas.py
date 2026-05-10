from pydantic import BaseModel, ConfigDict, Field, model_validator


class ActSafetyLevelCommissionMember(BaseModel):
    model_config = ConfigDict(extra="forbid")

    employee_id: int = Field(gt=0)


class ActSafetyLevelManualData(BaseModel):
    model_config = ConfigDict(extra="forbid")

    commission_members: list[ActSafetyLevelCommissionMember] = Field(min_length=1)

    @model_validator(mode="after")
    def validate_unique_employee_ids(self) -> "ActSafetyLevelManualData":
        employee_ids = [member.employee_id for member in self.commission_members]
        if len(employee_ids) != len(set(employee_ids)):
            raise ValueError("commission_members must not contain duplicate employee_id values")
        return self
