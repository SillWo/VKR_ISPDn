from pathlib import Path

from pydantic import BaseModel

from app.document_generation.context.builder import DocumentContextBuilder
from app.document_generation.core.document_definition import DocumentGenerator, DocumentManualField
from app.document_generation.documents.RKN_notification.schemas import RknNotificationManualData


class RknNotificationGenerator(DocumentGenerator):
    code = "RKN_notification"
    title = "Уведомление в Роскомнадзор о намерении осуществлять обработку персональных данных"
    description = (
        "Документ уровня организации для первичного уведомления Роскомнадзора о намерении осуществлять обработку "
        "персональных данных"
    )
    requires_ispdn = False
    template_path = Path(__file__).with_name("template.docx")

    def get_manual_fields(self) -> list[DocumentManualField]:
        return [
            DocumentManualField(
                name="rkn_access_persons",
                label="Сведения о лицах и организациях с доступом к ПДн в ГИС/МИС",
                type="array",
                required=False,
                items=[
                    DocumentManualField(name="person_type", label="Тип", type="text", required=True),
                    DocumentManualField(name="name", label="ФИО / Наименование", type="text", required=True),
                    DocumentManualField(name="address", label="Адрес", type="text", required=True),
                    DocumentManualField(name="email", label="Электронная почта", type="text", required=False),
                    DocumentManualField(name="phone", label="Телефон", type="text", required=False),
                ],
            ),
        ]

    def validate_manual_data(self, manual_data: dict) -> BaseModel:
        return RknNotificationManualData.model_validate(manual_data)

    def build_context(
        self,
        *,
        ispdn_id: int | None,
        manual_data: dict,
        context_builder: DocumentContextBuilder,
    ) -> dict:
        return context_builder.rkn_notification(manual_data)

    def build_output_filename(self, context: dict) -> str:
        return "Уведомление в РКН о намерении осуществлять обработку персональных данных.docx"

    def get_template_context_schema(self) -> dict:
        return {
            "fields": [
                "RKN_adress",
                "full_org_name",
                "main_office_reg",
                "operator_type",
                "sokr_org_name",
                "org_adress",
                "mail_org_adress",
                "org_phone",
                "org_faks",
                "org_email",
                "org_regions",
                "INN",
                "OGRN",
                "OKVED_list",
                "OKPO",
                "OKFS",
                "OKOGY",
                "OKOP",
                "branches_of_the_organization_list",
                "security_features",
                "is_using_SKZI",
                "SKZI_block",
                "employee_responsible_for_PDn",
                "employee_responsible_for_PDn_adress",
                "employee_responsible_for_PDn_phones",
                "employee_responsible_for_PDn_emails",
                "start_PDn_date",
                "termination_text",
                "cross_border_transfer_status",
                "main_name",
                "main_post",
                "main_phone",
                "date",
            ],
            "arrays": {
                "rkn_processing_processes": [
                    "process_name",
                    "purpose_of_processing",
                    "PDn_list",
                    "special_PDn_list",
                    "biometric_PDn_list",
                    "subjects_of_PDn",
                    "legal_basis",
                    "actions_with_PDn",
                    "actions_type",
                ],
                "rkn_data_centers": [
                    "COD_name",
                    "country_of_COD",
                    "COD_address",
                    "COD_status",
                    "owner_info",
                ],
                "rkn_access_persons": [
                    "display_name",
                    "individuals_type",
                    "name_label",
                    "individuals_name",
                    "individuals_address",
                    "individuals_email",
                    "individuals_phone",
                ],
            },
        }
