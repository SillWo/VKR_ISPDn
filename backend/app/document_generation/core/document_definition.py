from abc import ABC, abstractmethod
from pathlib import Path
from typing import TYPE_CHECKING, Literal

from pydantic import BaseModel, Field

if TYPE_CHECKING:
    from app.document_generation.context.builder import DocumentContextBuilder


DocumentManualFieldType = Literal["text", "textarea", "array"]


class DocumentManualField(BaseModel):
    name: str
    label: str
    type: DocumentManualFieldType
    required: bool = True
    items: list["DocumentManualField"] = Field(default_factory=list)


class DocumentGenerator(ABC):
    code: str
    title: str
    description: str
    requires_ispdn: bool
    template_path: Path

    @abstractmethod
    def get_manual_fields(self) -> list[DocumentManualField]:
        raise NotImplementedError

    @abstractmethod
    def validate_manual_data(self, manual_data: dict) -> BaseModel:
        raise NotImplementedError

    @abstractmethod
    def build_context(
        self,
        *,
        ispdn_id: int | None,
        manual_data: dict,
        context_builder: "DocumentContextBuilder",
    ) -> dict:
        raise NotImplementedError

    @abstractmethod
    def build_output_filename(self, context: dict) -> str:
        raise NotImplementedError

    def get_template_context_schema(self) -> dict:
        return {}

DocumentManualField.model_rebuild()
