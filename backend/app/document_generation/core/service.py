from dataclasses import dataclass
from io import BytesIO

from sqlalchemy.orm import Session

from app.document_generation.context.builder import DocumentContextBuilder
from app.document_generation.core.errors import DocumentRequiresIspdnError, DocumentTemplateNotFoundError
from app.document_generation.core.registry import DocumentRegistry, get_document_registry
from app.document_generation.core.renderer import DocxTemplateRenderer


DOCX_MEDIA_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


@dataclass(frozen=True)
class GeneratedDocument:
    filename: str
    file: BytesIO
    media_type: str


class DocumentGenerationService:
    def __init__(
        self,
        db: Session,
        registry: DocumentRegistry | None = None,
        renderer: DocxTemplateRenderer | None = None,
    ) -> None:
        self.db = db
        self.registry = registry or get_document_registry()
        self.renderer = renderer or DocxTemplateRenderer()

    def generate(
        self,
        *,
        document_type: str,
        ispdn_id: int | None,
        manual_data: dict,
        organization_id: int,
    ) -> GeneratedDocument:
        generator = self.registry.get_generator(document_type)
        if generator.requires_ispdn and ispdn_id is None:
            raise DocumentRequiresIspdnError("Document requires ispdn_id")

        validated_manual_data = generator.validate_manual_data(manual_data)
        context_builder = DocumentContextBuilder(self.db, organization_id)
        context = generator.build_context(
            ispdn_id=ispdn_id,
            manual_data=validated_manual_data.model_dump(),
            context_builder=context_builder,
        )

        if not generator.template_path.exists():
            raise DocumentTemplateNotFoundError(f"Template not found: {generator.template_path}")

        file = self.renderer.render(generator.template_path, context)
        return GeneratedDocument(
            filename=generator.build_output_filename(context),
            file=file,
            media_type=DOCX_MEDIA_TYPE,
        )
