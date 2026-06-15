from pathlib import Path

from pydantic import BaseModel

from app.document_generation.context.builder import DocumentContextBuilder
from app.document_generation.core.document_definition import DocumentGenerator, DocumentManualField
from app.document_generation.core.filenames import build_docx_filename
from app.document_generation.documents.RKN_notification.change_schemas import RknNotificationChangesManualData
from app.document_generation.documents.RKN_notification.generator import RknNotificationGenerator


class RknNotificationChangesGenerator(DocumentGenerator):
    code = "RKN_notification_changes"
    title = (
        "Уведомление в Роскомнадзор об изменении сведений, содержащихся в уведомлении о намерении осуществлять "
        "обработку персональных данных"
    )
    description = (
        "Документ уровня организации для уведомления Роскомнадзора об изменении ранее поданных сведений об обработке "
        "персональных данных"
    )
    requires_ispdn = False
    template_path = Path(__file__).with_name("template1.docx")

    def get_manual_fields(self) -> list[DocumentManualField]:
        return [
            DocumentManualField(
                name="change_date",
                label="Дата появления события",
                type="text",
                required=True,
            ),
            DocumentManualField(
                name="main_office_reg",
                label="Регистрационный номер организации в реестре РКН",
                type="text",
                required=True,
            ),
            *RknNotificationGenerator().get_manual_fields(),
        ]

    def validate_manual_data(self, manual_data: dict) -> BaseModel:
        return RknNotificationChangesManualData.model_validate(manual_data)

    def build_context(
        self,
        *,
        ispdn_id: int | None,
        manual_data: dict,
        context_builder: DocumentContextBuilder,
    ) -> dict:
        return context_builder.rkn_notification_changes(manual_data)

    def build_output_filename(self, context: dict) -> str:
        return build_docx_filename(self.title)

    def get_template_context_schema(self) -> dict:
        schema = RknNotificationGenerator().get_template_context_schema()
        fields = list(schema.get("fields", []))
        if "org_info" not in fields:
            fields.append("org_info")
        return {
            **schema,
            "fields": [
                *fields,
                "change_date",
                "org_reg_number",
            ],
        }
