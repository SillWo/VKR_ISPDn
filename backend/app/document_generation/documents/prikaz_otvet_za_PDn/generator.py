from pathlib import Path

from pydantic import BaseModel

from app.document_generation.context.builder import DocumentContextBuilder
from app.document_generation.core.document_definition import DocumentGenerator, DocumentManualField
from app.document_generation.core.errors import DocumentPrerequisiteMissingError
from app.document_generation.core.filenames import build_docx_filename
from app.document_generation.documents.prikaz_otvet_za_PDn.schemas import PrikazOtvetZaPdnManualData


class PrikazOtvetZaPdnGenerator(DocumentGenerator):
    code = "prikaz_otvet_za_PDn"
    title = "Приказ о назначении ответственного за обработку ПДн"
    description = "Глобальный документ организации о назначении ответственного за организацию обработки персональных данных"
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
        return PrikazOtvetZaPdnManualData.model_validate(manual_data)

    def build_context(
        self,
        *,
        ispdn_id: int | None,
        manual_data: dict,
        context_builder: DocumentContextBuilder,
    ) -> dict:
        system = context_builder.system()
        organization = context_builder.organization()

        responsible_employee_id = organization.get("personal_data_processing_responsible_employee_id")
        if not responsible_employee_id:
            raise DocumentPrerequisiteMissingError(
                "Для формирования приказа укажите ответственного за организацию обработки ПДн в карточке организации.",
            )

        head_employee_id = organization.get("head_employee_id")
        if not head_employee_id:
            raise DocumentPrerequisiteMissingError(
                "Для формирования приказа укажите руководителя организации в карточке организации.",
            )

        responsible_employee = context_builder.employee_document_context(int(responsible_employee_id))
        head_employee = context_builder.employee_document_context(int(head_employee_id))

        return {
            **system,
            **organization,
            "order_number": manual_data["order_number"],
            "org_city": organization.get("company_city") or organization.get("organization_registration_city"),
            "full_org_name": organization.get("full_organization_name"),
            "full_fio_1": responsible_employee["full_name"],
            "main_post": head_employee["position"],
            "main_fio": head_employee["full_name"],
        }

    def build_output_filename(self, context: dict) -> str:
        return build_docx_filename(self.title)

    def get_template_context_schema(self) -> dict:
        return {
            "fields": [
                "order_number",
                "current_date",
                "org_city",
                "full_org_name",
                "full_fio_1",
                "main_post",
                "main_fio",
            ],
            "arrays": {},
        }
