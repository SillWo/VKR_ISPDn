import re
from pathlib import Path

from pydantic import BaseModel

from app.document_generation.context.builder import DocumentContextBuilder
from app.document_generation.core.document_definition import DocumentGenerator, DocumentManualField
from app.document_generation.core.errors import DocumentPrerequisiteMissingError, DocumentRequiresIspdnError
from app.document_generation.documents.act_safety_level_of_ISPDn.schemas import ActSafetyLevelManualData
from app.services.security_level import SecurityLevelNotFoundError


INVALID_WINDOWS_FILENAME_CHARS = re.compile(r'[<>:"/\\|?*\x00-\x1f]')


def format_subject_group_for_document(value: str) -> str:
    normalized = value.strip().lower()
    labels = {
        "clients_only": "клиентов",
        "employees_only": "только сотрудников",
        "employees_and_clients": "сотрудников и клиентов",
        "только клиенты": "только клиентов",
        "только сотрудники": "только сотрудников",
        "и работники и сотрудники": "сотрудников и клиентов",
        "работники и клиенты": "сотрудников и клиентов",
        "сотрудники и клиенты": "сотрудников и клиентов",
    }
    return labels.get(normalized, value)


def format_threat_type_for_document(value: str) -> str:
    normalized = value.strip().lower()
    labels = {
        "threat_type_1": "1 тип угроз",
        "threat_type_2": "2 тип угроз",
        "threat_type_3": "3 тип угроз",
        "1 тип угроз": "1 тип угроз",
        "2 тип угроз": "2 тип угроз",
        "3 тип угроз": "3 тип угроз",
        "угрозы 1 типа": "1 тип угроз",
        "угрозы 2 типа": "2 тип угроз",
        "угрозы 3 типа": "3 тип угроз",
    }
    return labels.get(normalized, value)


class ActSafetyLevelOfIspdnGenerator(DocumentGenerator):
    code = "act_safety_level_of_ISPDn"
    title = "Акт оценки необходимого уровня защищённости ИСПДн"
    description = "Документ для фиксации результатов оценки необходимого уровня защищённости выбранной ИСПДн"
    requires_ispdn = True
    template_path = Path(__file__).with_name("template.docx")
    employee_name_mode = "document_initials"

    def get_manual_fields(self) -> list[DocumentManualField]:
        return [
            DocumentManualField(
                name="commission_members",
                label="Состав комиссии",
                type="array",
                required=True,
                items=[
                    DocumentManualField(
                        name="employee_id",
                        label="Сотрудник комиссии",
                        type="text",
                        required=True,
                    ),
                ],
            ),
        ]

    def validate_manual_data(self, manual_data: dict) -> BaseModel:
        return ActSafetyLevelManualData.model_validate(manual_data)

    def build_context(
        self,
        *,
        ispdn_id: int | None,
        manual_data: dict,
        context_builder: DocumentContextBuilder,
    ) -> dict:
        if ispdn_id is None:
            raise DocumentRequiresIspdnError("Act of ISPDn safety level assessment requires ispdn_id")

        try:
            security_level = context_builder.security_level(ispdn_id)
        except SecurityLevelNotFoundError as exc:
            raise DocumentPrerequisiteMissingError(
                'Для формирования акта сначала заполните модуль "Уровень защищённости" для выбранной ИСПДн.',
            ) from exc

        organization = context_builder.organization()
        ispdn = context_builder.ispdn(ispdn_id)
        system = context_builder.system()
        commission_members = [
            context_builder.employee_document_info(member["employee_id"])
            for member in manual_data["commission_members"]
        ]
        document_date = system["document_date"]
        commission_members_context = [
            {
                "name": member["name"],
                "position": member["position"],
                "document_date": document_date,
                "signature": "___________",
            }
            for member in commission_members
        ]

        return {
            **system,
            "main_name": organization.get("head_full_name"),
            "main_post": organization.get("head_position"),
            "ispdn_name": ispdn.get("ISPDn_name"),
            "org_full_name": organization.get("full_legal_name"),
            "person_in_com_x": self._build_numbered_multiline(
                [member["name"] for member in commission_members],
                first_item_number=False,
            ),
            "person_in_com_x_post": self._build_numbered_multiline(
                [member["position"] for member in commission_members],
                first_item_number=False,
            ),
            "type_of_PDn_x": ", ".join(security_level["data_categories"]),
            "amount_subjects_of_PDn": security_level["subject_count_range"],
            "type_of_subjects_of_PDn": format_subject_group_for_document(security_level["subject_group"]),
            "treat_type": format_threat_type_for_document(security_level["threat_type"]),
            "safety_level": f"{security_level['actual_level']} уровень защищённости персональных данных",
            "commission_members": commission_members_context,
        }

    def build_output_filename(self, context: dict) -> str:
        ispdn_name = str(context.get("ispdn_name") or "ИСПДн")
        safe_ispdn_name = INVALID_WINDOWS_FILENAME_CHARS.sub("_", ispdn_name).strip(" .")
        if not safe_ispdn_name:
            safe_ispdn_name = "ИСПДн"
        return f"Акт оценки уровня защищённости ИСПДн {safe_ispdn_name}.docx"

    @staticmethod
    def _build_numbered_multiline(values: list[str], *, first_item_number: bool) -> str:
        lines = []
        for index, value in enumerate(values, start=1):
            if index == 1 and not first_item_number:
                lines.append(value)
            else:
                lines.append(f"{index}. {value}")
        return "\n".join(lines)
