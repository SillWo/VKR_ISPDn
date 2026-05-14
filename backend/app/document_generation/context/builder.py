from sqlalchemy.orm import Session

from app.document_generation.context.providers.control_events_provider import ControlEventsContextProvider
from app.document_generation.context.providers.employee_provider import EmployeeContextProvider, EmployeeNameMode
from app.document_generation.context.providers.ispdn_provider import IspdnContextProvider
from app.document_generation.context.providers.organization_provider import OrganizationContextProvider
from app.document_generation.context.providers.processing_provider import ProcessingContextProvider
from app.document_generation.context.providers.rkn_notification_provider import RknNotificationContextProvider
from app.document_generation.context.providers.security_level_provider import SecurityLevelContextProvider
from app.document_generation.context.providers.security_measures_provider import SecurityMeasuresContextProvider
from app.document_generation.context.providers.system_provider import SystemContextProvider
from app.document_generation.context.providers.tasks_provider import TasksContextProvider
from app.document_generation.context.providers.threat_model_provider import ThreatModelContextProvider


class DocumentContextBuilder:
    def __init__(self, db: Session) -> None:
        self.system_provider = SystemContextProvider()
        self.organization_provider = OrganizationContextProvider(db)
        self.employee_provider = EmployeeContextProvider(db)
        self.ispdn_provider = IspdnContextProvider(db)
        self.processing_provider = ProcessingContextProvider(db)
        self.security_level_provider = SecurityLevelContextProvider(db)
        self.security_measures_provider = SecurityMeasuresContextProvider(db)
        self.threat_model_provider = ThreatModelContextProvider()
        self.tasks_provider = TasksContextProvider()
        self.control_events_provider = ControlEventsContextProvider(db)
        self.rkn_notification_provider = RknNotificationContextProvider(db)

    def system(self) -> dict:
        return self.system_provider.get_context()

    def organization(self) -> dict:
        return self.organization_provider.get_context()

    def employee_name(self, employee_id: int, mode: EmployeeNameMode) -> str:
        return self.employee_provider.get_employee_name(employee_id, mode)

    def employee_document_context(self, employee_id: int) -> dict:
        return self.employee_provider.get_employee_document_context(employee_id)

    def employee_document_info(self, employee_id: int) -> dict:
        return self.employee_provider.get_employee_document_info(employee_id)

    def control_event_name(self, control_event_id: int) -> str:
        return self.control_events_provider.get_control_event_name(control_event_id)

    def ispdn(self, ispdn_id: int) -> dict:
        return self.ispdn_provider.get_context(ispdn_id)

    def processing(self, ispdn_id: int) -> dict:
        return self.processing_provider.get_context(ispdn_id)

    def security_level(self, ispdn_id: int) -> dict:
        return self.security_level_provider.get_context(ispdn_id)

    def security_measures(self, ispdn_id: int) -> dict:
        return self.security_measures_provider.get_context(ispdn_id)

    def threat_model(self, ispdn_id: int) -> dict:
        return self.threat_model_provider.get_context(ispdn_id)

    def tasks(self, ispdn_id: int) -> dict:
        return self.tasks_provider.get_context(ispdn_id)

    def control_events(self, ispdn_id: int) -> dict:
        return self.control_events_provider.get_context(ispdn_id)

    def rkn_notification(self, manual_data: dict) -> dict:
        return self.rkn_notification_provider.get_context(manual_data)

    def rkn_notification_changes(self, manual_data: dict) -> dict:
        return self.rkn_notification_provider.get_changes_context(manual_data)
