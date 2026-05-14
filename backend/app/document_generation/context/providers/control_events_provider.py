from sqlalchemy.orm import Session

from app.document_generation.core.errors import DocumentControlEventNotFoundError
from app.repositories.control_event import ControlEventRepository
from app.services.control_event import ControlEventNotFoundError, ControlEventService


class ControlEventsContextProvider:
    def __init__(self, db: Session, organization_id: int) -> None:
        self.organization_id = organization_id
        self.service = ControlEventService(ControlEventRepository(db))

    def get_control_event_name(self, control_event_id: int) -> str:
        try:
            return self.service.get_control_event(control_event_id, self.organization_id).name
        except ControlEventNotFoundError as exc:
            raise DocumentControlEventNotFoundError(f"Control event not found: {control_event_id}") from exc

    def get_context(self, ispdn_id: int) -> dict:
        control_events = [
            {
                "id": control_event.id,
                "name": control_event.name,
                "description": control_event.description,
                "files": [
                    {
                        "id": control_event_file.id,
                        "file_name": control_event_file.file_name,
                        "file_content_type": control_event_file.file_content_type,
                        "file_size_bytes": control_event_file.file_size_bytes,
                        "created_at": control_event_file.created_at,
                    }
                    for control_event_file in control_event.files
                ],
                "created_at": control_event.created_at,
                "updated_at": control_event.updated_at,
            }
            for control_event in self.service.list_control_events(self.organization_id)
        ]
        return {
            "control_events": control_events,
            "control_events_count": len(control_events),
        }
