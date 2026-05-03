from io import BytesIO
from pathlib import Path

from docxtpl import DocxTemplate

from app.document_generation.core.errors import DocumentRenderError


class DocxTemplateRenderer:
    def render(self, template_path: Path, context: dict) -> BytesIO:
        try:
            template = DocxTemplate(str(template_path))
            template.render(context, autoescape=True)
            output = BytesIO()
            template.save(output)
            output.seek(0)
            return output
        except Exception as exc:
            raise DocumentRenderError("Failed to render DOCX template") from exc
