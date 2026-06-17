from pathlib import Path

from pydantic import BaseModel

from app.document_generation.context.builder import DocumentContextBuilder
from app.document_generation.core.document_definition import DocumentGenerator, DocumentManualField
from app.document_generation.core.errors import DocumentRequiresIspdnError
from app.document_generation.core.filenames import build_docx_filename
from app.document_generation.documents.prikaz_perechen_lic.schemas import (
    PrikazPerechenLicManualData,
)


class PrikazPerechenLicGenerator(DocumentGenerator):
    code = "prikaz_perechen_lic"
    title = "Приказ об утверждении перечня лиц с доступом к ПДн, обрабатываемых в ИСПДн"
    description = "Документ для утверждения перечня сотрудников с доступом к персональным данным в выбранной ИСПДн"
    requires_ispdn = True
    template_path = Path(__file__).with_name("template.docx")

    def get_manual_fields(self) -> list[DocumentManualField]:
        return [
            DocumentManualField(
                name="order_number",
                label="Номер приказа",
                type="text",
                required=True,
            ),
            DocumentManualField(
                name="access_persons",
                label="Сотрудники с доступом к ПДн",
                type="array",
                required=True,
                items=[
                    DocumentManualField(
                        name="employee_id",
                        label="Сотрудник",
                        type="text",
                        required=True,
                    ),
                ],
            ),
        ]

    def validate_manual_data(self, manual_data: dict) -> BaseModel:
        return PrikazPerechenLicManualData.model_validate(manual_data)

    def build_context(
        self,
        *,
        ispdn_id: int | None,
        manual_data: dict,
        context_builder: DocumentContextBuilder,
    ) -> dict:
        if ispdn_id is None:
            raise DocumentRequiresIspdnError("Prikaz perechen lic requires ispdn_id")

        system = context_builder.system()
        organization = context_builder.organization()
        ispdn = context_builder.ispdn(ispdn_id)
        access_persons = [
            self._build_access_person_context(context_builder, person["employee_id"])
            for person in manual_data["access_persons"]
        ]

        return {
            **system,
            **organization,
            **ispdn,
            "order_number": manual_data["order_number"],
            "org_city": organization.get("company_city") or organization.get("organization_registration_city"),
            "full_organization_name": organization.get("full_organization_name"),
            "position_of_the_head_of_the_organization": organization.get(
                "position_of_the_head_of_the_organization",
            ),
            "access_persons": access_persons,
        }

    def build_output_filename(self, context: dict) -> str:
        ispdn_name = str(context.get("ISPDn_name") or "ИСПДн")
        return build_docx_filename(self.title, ispdn_name)

    @staticmethod
    def _build_access_person_context(context_builder: DocumentContextBuilder, employee_id: int) -> dict:
        employee = context_builder.employee_document_context(employee_id)
        return {
            "position": employee["position"],
            "full_name": employee["full_name"],
        }
