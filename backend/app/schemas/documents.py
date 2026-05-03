from typing import Any

from pydantic import BaseModel, Field

from app.document_generation.core.document_definition import DocumentManualField


class DocumentTypeRead(BaseModel):
    code: str
    title: str
    description: str
    requires_ispdn: bool
    manual_fields: list[DocumentManualField]


class DocumentGenerateRequest(BaseModel):
    document_type: str = Field(min_length=1)
    manual_data: dict[str, Any] = Field(default_factory=dict)
