from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.schemas.text import strip_required_text


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=6, max_length=255)
    organization_name: str = Field(min_length=1, max_length=255)

    _strip_username = field_validator("username", "organization_name", mode="before")(strip_required_text)


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=1, max_length=255)

    _strip_username = field_validator("username", mode="before")(strip_required_text)


class AuthUserRead(BaseModel):
    id: int
    username: str
    organization_id: int
    organization_name: str
    employee_id: int | None
    is_owner: bool


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    user: AuthUserRead
