from pathlib import Path

from pydantic import BaseModel

from app.document_generation.context.builder import DocumentContextBuilder
from app.document_generation.core.document_definition import DocumentGenerator, DocumentManualField
from app.document_generation.documents.PDn_security.schemas import PdnSecurityManualData


class PdnSecurityGenerator(DocumentGenerator):
    code = "PDn_security"
    title = "Положение об организации и обеспечении защиты персональных данных"
    description = (
        "Глобальный документ организации, определяющий порядок организации и обеспечения защиты персональных данных"
    )
    requires_ispdn = False
    template_path = Path(__file__).with_name("template.docx")

    def get_manual_fields(self) -> list[DocumentManualField]:
        return [
            DocumentManualField(
                name="order_number",
                label="Номер приказа",
                type="text",
                required=True,
            ),
        ]

    def validate_manual_data(self, manual_data: dict) -> BaseModel:
        return PdnSecurityManualData.model_validate(manual_data)

    def build_context(
        self,
        *,
        ispdn_id: int | None,
        manual_data: dict,
        context_builder: DocumentContextBuilder,
    ) -> dict:
        return context_builder.pdn_security(manual_data)

    def build_output_filename(self, context: dict) -> str:
        return "Положение об организации и обеспечении защиты персональных данных.docx"

    def get_template_context_schema(self) -> dict:
        return {
            "fields": [
                "order_number",
                "date",
                "org_city",
                "org_full_name",
                "ORG_FULL_NAME",
                "main_post",
                "main_FIO",
                "year",
            ],
            "arrays": {},
        }
