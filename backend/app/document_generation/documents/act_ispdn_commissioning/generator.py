import re
from pathlib import Path

from pydantic import BaseModel

from app.document_generation.context.builder import DocumentContextBuilder
from app.document_generation.core.document_definition import DocumentGenerator, DocumentManualField
from app.document_generation.core.errors import DocumentRequiresIspdnError
from app.document_generation.documents.act_ispdn_commissioning.schemas import (
    ActIspdnCommissioningManualData,
)


INVALID_WINDOWS_FILENAME_CHARS = re.compile(r'[<>:"/\\|?*\x00-\x1f]')


class ActIspdnCommissioningGenerator(DocumentGenerator):
    code = "act_ispdn_commissioning"
    title = "Акт ввода ИСПДн"
    description = "Документ для фиксации ввода ИСПДн в эксплуатацию"
    requires_ispdn = True
    template_path = Path(__file__).with_name("template.docx")

    def get_manual_fields(self) -> list[DocumentManualField]:
        return [
            DocumentManualField(
                name="description_of_violations_and_disadvantages",
                label="Обнаруженные нарушения и недостатки",
                type="textarea",
                required=True,
            ),
            DocumentManualField(
                name="recommendation",
                label="Рекомендации",
                type="textarea",
                required=True,
            ),
            DocumentManualField(
                name="events",
                label="Проведённые мероприятия",
                type="array",
                required=True,
                items=[
                    DocumentManualField(
                        name="event_name",
                        label="Название мероприятия",
                        type="text",
                        required=True,
                    ),
                    DocumentManualField(
                        name="responsible_for_the_event",
                        label="Ответственный за мероприятие",
                        type="text",
                        required=True,
                    ),
                ],
            ),
        ]

    def validate_manual_data(self, manual_data: dict) -> BaseModel:
        return ActIspdnCommissioningManualData.model_validate(manual_data)

    def build_context(
        self,
        *,
        ispdn_id: int | None,
        manual_data: dict,
        context_builder: DocumentContextBuilder,
    ) -> dict:
        if ispdn_id is None:
            raise DocumentRequiresIspdnError("Act of ISPDn commissioning requires ispdn_id")

        events = [
            {
                "event_number": index,
                "event_name": event["event_name"],
                "responsible_for_the_event": event["responsible_for_the_event"],
            }
            for index, event in enumerate(manual_data["events"], start=1)
        ]

        return {
            **context_builder.organization(),
            **context_builder.ispdn(ispdn_id),
            "description_of_violations_and_disadvantages": manual_data[
                "description_of_violations_and_disadvantages"
            ],
            "recommendation": manual_data["recommendation"],
            "events": events,
        }

    def build_output_filename(self, context: dict) -> str:
        ispdn_name = str(context.get("ISPDn_name") or "ИСПДн")
        safe_ispdn_name = INVALID_WINDOWS_FILENAME_CHARS.sub("_", ispdn_name).strip(" .")
        if not safe_ispdn_name:
            safe_ispdn_name = "ИСПДн"
        return f"Акт ввода ИСПДн {safe_ispdn_name}.docx"
