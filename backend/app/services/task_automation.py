from datetime import date, timedelta

from app.domain.fstek21_measures import FSTEK21_MEASURES, get_measure_regulatory_status
from app.domain.processing_process_subsumption import is_new_processing_process_for_task_automation
from app.models.processing_process import ProcessingProcess
from app.models.task_event import TaskEvent
from app.repositories.ispdn import IspdnRepository
from app.repositories.processing_process import ProcessingProcessRepository
from app.repositories.security_level import SecurityLevelRepository
from app.repositories.security_measure import SecurityMeasureRepository
from app.repositories.task_event import TaskEventRepository


class TaskAutomationService:
    def __init__(
        self,
        task_event_repository: TaskEventRepository,
        ispdn_repository: IspdnRepository,
        processing_process_repository: ProcessingProcessRepository,
        security_level_repository: SecurityLevelRepository,
        security_measure_repository: SecurityMeasureRepository,
    ) -> None:
        self.task_event_repository = task_event_repository
        self.ispdn_repository = ispdn_repository
        self.processing_process_repository = processing_process_repository
        self.security_level_repository = security_level_repository
        self.security_measure_repository = security_measure_repository

    def create_ispdn_created_event(self, ispdn_id: int, organization_id: int) -> TaskEvent:
        responsible_employee_id = self._get_ispdn_responsible_employee_id(ispdn_id, organization_id)
        task_event = self.task_event_repository.create_event_once(
            ispdn_id=ispdn_id,
            event_type="ispdn_created",
            source_module="ispdn_registry",
            title="РЎРѕР·РґР°РЅРёРµ РЅРѕРІРѕР№ РРЎРџР”РЅ",
            description=(
                "РЎРѕР·РґР°РЅР° РЅРѕРІР°СЏ РРЎРџР”РЅ, РґР»СЏ РєРѕС‚РѕСЂРѕР№ РЅРµРѕР±С…РѕРґРёРјРѕ Р·Р°РІРµСЂС€РёС‚СЊ РїРµСЂРІРёС‡РЅРѕРµ Р·Р°РїРѕР»РЅРµРЅРёРµ РєРѕРЅС‚СЂРѕР»СЊРЅС‹С… РґР°РЅРЅС‹С…."
            ),
            automation_key=self._ispdn_created_key(ispdn_id),
            organization_id=organization_id,
        )
        self.task_event_repository.create_task_once(
            task_event_id=task_event.id,
            title='Р—Р°РїРѕР»РЅРµРЅРёРµ РјРѕРґСѓР»СЏ "РўРµС…РЅРёС‡РµСЃРєРёРµ РјРµСЂС‹ Р·Р°С‰РёС‚С‹"',
            description=(
                "Р’Р°Рј РЅРµРѕР±С…РѕРґРёРјРѕ СѓРєР°Р·Р°С‚СЊ С„Р°РєС‚РёС‡РµСЃРєРёР№ СЃС‚Р°С‚СѓСЃ РІСЃРµС… РјРµСЂ С‚РµС…РЅРёС‡РµСЃРєРѕР№ Р·Р°С‰РёС‚С‹ РґР»СЏ РРЎРџР”РЅ Рё Р·Р°РїРѕР»РЅРёС‚СЊ "
                "РєРѕРјРјРµРЅС‚Р°СЂРёР№, РµСЃР»Рё С„Р°РєС‚РёС‡РµСЃРєРёР№ СЃС‚Р°С‚СѓСЃ РЅРµ СЃРѕРІРїР°РґР°РµС‚ СЃ СЃС‚Р°С‚СѓСЃРѕРј РїРѕ РїСЂРёРєР°Р·Сѓ Р¤РЎРўР­Рљ в„–21"
            ),
            importance="high",
            status="pending",
            automation_key="fill_technical_security_measures",
            responsible_employee_id=responsible_employee_id,
        )
        self.sync_fill_technical_security_measures_task(ispdn_id, organization_id)
        return self.task_event_repository.get_event_by_id(task_event.id, organization_id) or task_event

    def create_actual_security_level_changed_event(self, ispdn_id: int, organization_id: int) -> TaskEvent:
        responsible_employee_id = self._get_ispdn_responsible_employee_id(ispdn_id, organization_id)
        task_event = self.task_event_repository.create_event(
            ispdn_id=ispdn_id,
            event_type="actual_security_level_changed",
            source_module="security_level",
            title="РР·РјРµРЅРµРЅРёРµ С„Р°РєС‚РёС‡РµСЃРєРѕРіРѕ СѓСЂРѕРІРЅСЏ Р·Р°С‰РёС‰С‘РЅРЅРѕСЃС‚Рё Сѓ РРЎРџР”РЅ",
            description="РЈ РРЎРџР”РЅ Р±С‹Р» РёР·РјРµРЅС‘РЅ С„Р°РєС‚РёС‡РµСЃРєРёР№ СѓСЂРѕРІРµРЅСЊ Р·Р°С‰РёС‰С‘РЅРЅРѕСЃС‚Рё.",
            organization_id=organization_id,
        )
        self.task_event_repository.create_task_once(
            task_event_id=task_event.id,
            title="РџРµСЂРµСЃРјРѕС‚СЂ С‚РµС…РЅРёС‡РµСЃРєРёС… РјРµСЂ Р·Р°С‰РёС‚С‹",
            description=(
                "РЈ РРЎРџР”РЅ Р±С‹Р» РёР·РјРµРЅС‘РЅ С„Р°РєС‚РёС‡РµСЃРєРёР№ СѓСЂРѕРІРµРЅСЊ Р·Р°С‰РёС‰С‘РЅРЅРѕСЃС‚Рё. Р’Р°Рј РЅРµРѕР±С…РѕРґРёРјРѕ Р°РєС‚СѓР°Р»РёР·РёСЂРѕРІР°С‚СЊ РїСЂРёРјРµРЅСЏРµРјС‹Рµ "
                "С‚РµС…РЅРёС‡РµСЃРєРёРµ РјРµСЂС‹ Р·Р°С‰РёС‚С‹"
            ),
            importance="high",
            status="pending",
            automation_key="review_technical_security_measures",
            responsible_employee_id=responsible_employee_id,
        )
        return self.task_event_repository.get_event_by_id(task_event.id, organization_id) or task_event

    def sync_after_security_level_saved(
        self,
        ispdn_id: int,
        organization_id: int,
        *,
        previous_actual_level: int | None,
        current_actual_level: int,
        had_existing_record: bool,
    ) -> None:
        if had_existing_record and previous_actual_level != current_actual_level:
            self.create_actual_security_level_changed_event(ispdn_id, organization_id)
        self.sync_security_level_mismatch_without_file(ispdn_id, organization_id)
        self.sync_fill_technical_security_measures_task(ispdn_id, organization_id)

    def sync_fill_technical_security_measures_task(self, ispdn_id: int, organization_id: int) -> None:
        security_level = self.security_level_repository.get_by_ispdn(ispdn_id)
        if security_level is None:
            return

        records_by_code = {
            record.measure_code: record for record in self.security_measure_repository.get_measure_records(ispdn_id)
        }
        all_base_set_implemented = True
        has_missing_required_comment = False

        for measure in FSTEK21_MEASURES:
            measure_code = measure["code"]
            regulatory_status = get_measure_regulatory_status(measure_code, security_level.actual_level)
            record = records_by_code.get(measure_code)
            factual_status = record.factual_status if record is not None else "not_implemented"
            comment = record.comment if record is not None else None

            if regulatory_status == "base_set" and factual_status != "implemented":
                all_base_set_implemented = False
            if self._is_comment_required(regulatory_status, factual_status) and not self._has_text(comment):
                has_missing_required_comment = True

        if not all_base_set_implemented or has_missing_required_comment:
            return

        task_event = self.task_event_repository.get_event_by_automation_key(self._ispdn_created_key(ispdn_id), organization_id)
        if task_event is None:
            return
        task = self.task_event_repository.get_task_by_automation_key(
            task_event.id,
            "fill_technical_security_measures",
        )
        if task is not None and task.status != "done":
            self.task_event_repository.mark_task_done(task)

    def sync_security_level_mismatch_without_file(self, ispdn_id: int, organization_id: int) -> None:
        security_level = self.security_level_repository.get_by_ispdn(ispdn_id)
        if security_level is None:
            return

        automation_key = self._security_level_mismatch_key(ispdn_id)
        has_mismatch_without_file = (
            security_level.actual_level != security_level.recommended_level
            and not self._has_text(security_level.deviation_justification_file_path)
        )

        if has_mismatch_without_file:
            responsible_employee_id = self._get_ispdn_responsible_employee_id(ispdn_id, organization_id)
            task_event = self.task_event_repository.create_event_once(
                ispdn_id=ispdn_id,
                event_type="security_level_mismatch_without_file",
                source_module="security_level",
                title="Р¤Р°РєС‚РёС‡РµСЃРєРёР№ СѓСЂРѕРІРµРЅСЊ Р·Р°С‰РёС‰С‘РЅРЅРѕСЃС‚Рё РРЎРџР”РЅ РЅРµ СЃРѕРІРїР°РґР°РµС‚ СЃ СЂРµРєРѕРјРµРЅРґСѓРµРјС‹Рј",
                description=(
                    "Р¤Р°РєС‚РёС‡РµСЃРєРёР№ СѓСЂРѕРІРµРЅСЊ Р·Р°С‰РёС‰С‘РЅРЅРѕСЃС‚Рё РѕС‚Р»РёС‡Р°РµС‚СЃСЏ РѕС‚ СЂРµРєРѕРјРµРЅРґСѓРµРјРѕРіРѕ, Р° С„Р°Р№Р» СЃ РѕР±РѕСЃРЅРѕРІР°РЅРёРµРј РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚."
                ),
                automation_key=automation_key,
                organization_id=organization_id,
            )
            self.task_event_repository.create_task_once(
                task_event_id=task_event.id,
                title="Р”РѕР±Р°РІРёС‚СЊ РѕР±РѕСЃРЅРѕРІР°РЅРёРµ РѕС‚Р»РёС‡РёСЏ С„Р°РєС‚РёС‡РµСЃРєРѕРіРѕ СѓСЂРѕРІРЅСЏ Р·Р°С‰РёС‰С‘РЅРЅРѕСЃС‚Рё",
                description=(
                    "РЈ РІР°С€РµР№ РРЎРџР”РЅ СЂРµРєРѕРјРµРЅРґСѓРµРјС‹Р№ СѓСЂРѕРІРµРЅСЊ Р·Р°С‰РёС‰С‘РЅРЅРѕСЃС‚Рё РїРѕ РџРѕСЃС‚Р°РЅРѕРІР»РµРЅРёСЋ РїСЂР°РІРёС‚РµР»СЊСЃС‚РІР° в„–1119 РѕС‚Р»РёС‡Р°РµС‚СЃСЏ "
                    "РѕС‚ С„Р°РєС‚РёС‡РµСЃРєРѕРіРѕ, РїСЂРё СЌС‚Рѕ РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ РґРѕРєСѓРјРµРЅС‚ СЃ РѕР±РѕСЃРЅРѕРІР°РЅРёРµРј. Р”РѕР±Р°РІСЊС‚Рµ РµРіРѕ РІ Р±Р»РёР¶Р°Р№С€РµРµ РІСЂРµРјСЏ РёР»Рё "
                    "РёР·РјРµРЅРёС‚Рµ С„Р°РєС‚РёС‡РµСЃРєРёР№ СѓСЂРѕРІРµРЅСЊ Р·Р°С‰РёС‰С‘РЅРЅРѕСЃС‚Рё"
                ),
                importance="high",
                status="pending",
                automation_key="add_security_level_deviation_file",
                responsible_employee_id=responsible_employee_id,
            )
            return

        task_event = self.task_event_repository.get_event_by_automation_key(automation_key, organization_id)
        if task_event is None:
            return
        task = self.task_event_repository.get_task_by_automation_key(
            task_event.id,
            "add_security_level_deviation_file",
        )
        if task is not None and task.status != "done":
            self.task_event_repository.mark_task_done(task)

    def create_processing_process_created_events(self, process_id: int, organization_id: int) -> list[TaskEvent]:
        process = self.processing_process_repository.get_by_id(process_id, organization_id)
        if process is None:
            return []

        active_ispdns = self.processing_process_repository.list_active_ispdns_for_process(process.id, organization_id)
        if not active_ispdns:
            return []

        existing_processes = self.processing_process_repository.list_by_purpose_and_period_excluding(
            process.id,
            process.purpose_name,
            process.processing_period,
            organization_id,
        )
        if not is_new_processing_process_for_task_automation(process, existing_processes):
            return []

        created_events: list[TaskEvent] = []
        for ispdn in active_ispdns:
            responsible_employee_id = ispdn.responsible_employee_id
            task_event = self.task_event_repository.create_event_once(
                ispdn_id=ispdn.id,
                event_type="processing_process_created",
                source_module="processing_processes",
                title="РЎРѕР·РґР°РЅРёРµ РЅРѕРІРѕРіРѕ РїСЂРѕС†РµСЃСЃР° РѕР±СЂР°Р±РѕС‚РєРё",
                description=(
                    "РќРѕРІС‹Р№ РїСЂРѕС†РµСЃСЃ РѕР±СЂР°Р±РѕС‚РєРё СЃРІСЏР·Р°РЅ СЃ РґРµР№СЃС‚РІСѓСЋС‰РµР№ РРЎРџР”РЅ Рё С‚СЂРµР±СѓРµС‚ Р°РєС‚СѓР°Р»РёР·Р°С†РёРё РґРѕРєСѓРјРµРЅС‚РѕРІ."
                ),
                automation_key=f"processing_process_created:{ispdn.id}:{process.id}",
                organization_id=organization_id,
            )
            self._create_rkn_change_notification_task(
                task_event_id=task_event.id,
                description=(
                    "Р’Р°РјРё Р±С‹Р» СЃРѕР·РґР°РЅ РЅРѕРІС‹Р№ РїСЂРѕС†РµСЃСЃ РѕР±СЂР°Р±РѕС‚РєРё, Рѕ РєРѕС‚РѕСЂРѕРј РЅРµРѕР±С…РѕРґРёРјРѕ СѓРІРµРґРѕРјРёС‚СЊ Р РѕСЃРєРѕРјРЅР°РґР·РѕСЂ С‡РµСЂРµР· "
                    "СѓРІРµРґРѕРјР»РµРЅРёРµ РѕР± РёР·РјРµРЅРµРЅРёРё СЃРІРµРґРµРЅРёР№."
                ),
                responsible_employee_id=responsible_employee_id,
            )
            self.task_event_repository.create_task_once(
                task_event_id=task_event.id,
                title="Р’С‹РїСѓСЃРє РЅРѕРІРѕРіРѕ РџРѕР»РѕР¶РµРЅРёСЏ РѕР± РѕР±СЂР°Р±РѕС‚РєРµ РїРµСЂСЃРѕРЅР°Р»СЊРЅС‹С… РґР°РЅРЅС‹С…",
                description=(
                    "Р’Р°РјРё Р±С‹Р» СЃРѕР·РґР°РЅ РЅРѕРІС‹Р№ РїСЂРѕС†РµСЃСЃ РѕР±СЂР°Р±РѕС‚РєРё, РєРѕС‚РѕСЂС‹Р№ РЅРµРѕР±С…РѕРґРёРјРѕ РІРЅРµСЃС‚Рё РІ РїРѕР»РѕР¶РµРЅРёРµ РѕР± РѕР±СЂР°Р±РѕС‚РєРµ "
                    "РїРµСЂСЃРѕРЅР°Р»СЊРЅС‹С… РґР°РЅРЅС‹С…. РЎРѕР·РґР°Р№С‚Рµ Рё РІС‹РїСѓСЃС‚РёС‚Рµ РЅРѕРІС‹Р№ РґРѕРєСѓРјРµРЅС‚"
                ),
                importance="medium",
                status="pending",
                automation_key="issue_pdn_processing_policy",
                responsible_employee_id=responsible_employee_id,
            )
            created_events.append(self.task_event_repository.get_event_by_id(task_event.id, organization_id) or task_event)
        return created_events

    def create_crypto_tool_added_events(self, ispdn_id: int, added_crypto_tool_ids: list[int], organization_id: int) -> list[TaskEvent]:
        ispdn = self.ispdn_repository.get_by_id(ispdn_id, organization_id)
        if ispdn is None or ispdn.status != "active":
            return []

        created_events: list[TaskEvent] = []
        for crypto_tool_id in added_crypto_tool_ids:
            task_event = self.task_event_repository.create_event_once(
                ispdn_id=ispdn.id,
                event_type="crypto_tool_added_to_active_ispdn",
                source_module="cryptography",
                title="РџРѕСЏРІР»РµРЅРёРµ РЅРѕРІРѕРіРѕ РЎРљР—Р Сѓ РґРµР№СЃС‚РІСѓСЋС‰РµР№ РРЎРџР”РЅ",
                description=(
                    "Р’С‹ СѓРєР°Р·Р°Р»Рё РёСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ РЅРѕРІРѕРіРѕ РЎРљР—Р РІ РѕРґРЅРѕР№ РёР· РґРµР№СЃС‚РІСѓСЋС‰РёС… РРЎРџР”РЅ. РќРµРѕР±С…РѕРґРёРјРѕ РїРѕРґР°С‚СЊ "
                    "СѓРІРµРґРѕРјР»РµРЅРёРµ РІ Р РљРќ РѕР± РёСЃРїРѕР»СЊР·РѕРІР°РЅРёРё РЅРѕРІРѕРіРѕ РЎРљР—Р РїСЂРё РѕР±СЂР°Р±РѕС‚РєРµ РџР”РЅ."
                ),
                automation_key=f"crypto_tool_added_to_active_ispdn:{ispdn.id}:{crypto_tool_id}",
                organization_id=organization_id,
            )
            self._create_rkn_change_notification_task(
                task_event_id=task_event.id,
                description=(
                    "Р’ РРЎРџР”РЅ Р±С‹Р»Рѕ РґРѕР±Р°РІР»РµРЅРѕ РЅРѕРІРѕРµ РЎРљР—Р. РќРµРѕР±С…РѕРґРёРјРѕ РїРѕРґР°С‚СЊ СѓРІРµРґРѕРјР»РµРЅРёРµ РІ Р РљРќ РѕР± РёР·РјРµРЅРµРЅРёРё СЃРІРµРґРµРЅРёР№."
                ),
                responsible_employee_id=ispdn.responsible_employee_id,
            )
            created_events.append(self.task_event_repository.get_event_by_id(task_event.id, organization_id) or task_event)
        return created_events

    def create_data_center_added_events(self, ispdn_id: int, added_data_center_ids: list[int], organization_id: int) -> list[TaskEvent]:
        ispdn = self.ispdn_repository.get_by_id(ispdn_id, organization_id)
        if ispdn is None or ispdn.status != "active":
            return []

        created_events: list[TaskEvent] = []
        for data_center_id in added_data_center_ids:
            task_event = self.task_event_repository.create_event_once(
                ispdn_id=ispdn.id,
                event_type="data_center_added_to_active_ispdn",
                source_module="data_centers",
                title="РџРѕСЏРІР»РµРЅРёРµ РЅРѕРІРѕРіРѕ Р¦РћР” Сѓ РґРµР№СЃС‚РІСѓСЋС‰РµР№ РРЎРџР”РЅ",
                description=(
                    "Р’С‹ СѓРєР°Р·Р°Р»Рё РёСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ РЅРѕРІРѕРіРѕ Р¦РћР” РІ РѕРґРЅРѕР№ РёР· РґРµР№СЃС‚РІСѓСЋС‰РёС… РРЎРџР”РЅ. РќРµРѕР±С…РѕРґРёРјРѕ РїРѕРґР°С‚СЊ СѓРІРµРґРѕРјР»РµРЅРёРµ "
                    "РІ Р РљРќ РѕР± РёСЃРїРѕР»СЊР·РѕРІР°РЅРёРё РЅРѕРІРѕРіРѕ Р¦РћР” РїСЂРё РѕР±СЂР°Р±РѕС‚РєРµ РџР”РЅ."
                ),
                automation_key=f"data_center_added_to_active_ispdn:{ispdn.id}:{data_center_id}",
                organization_id=organization_id,
            )
            self._create_rkn_change_notification_task(
                task_event_id=task_event.id,
                description=(
                    "Р’ РРЎРџР”РЅ Р±С‹Р» РґРѕР±Р°РІР»РµРЅ РЅРѕРІС‹Р№ Р¦РћР”. РќРµРѕР±С…РѕРґРёРјРѕ РїРѕРґР°С‚СЊ СѓРІРµРґРѕРјР»РµРЅРёРµ РІ Р РљРќ РѕР± РёР·РјРµРЅРµРЅРёРё СЃРІРµРґРµРЅРёР№."
                ),
                responsible_employee_id=ispdn.responsible_employee_id,
            )
            created_events.append(self.task_event_repository.get_event_by_id(task_event.id, organization_id) or task_event)
        return created_events

    def create_organization_data_changed_events(self, organization_id: int) -> list[TaskEvent]:
        active_ispdns = self.ispdn_repository.list(organization_id, status="active")
        created_events: list[TaskEvent] = []
        for ispdn in active_ispdns:
            task_event = self.task_event_repository.create_event(
                ispdn_id=ispdn.id,
                event_type="organization_data_changed",
                source_module="organization",
                title="РР·РјРµРЅРёР»РёСЃСЊ РґР°РЅРЅС‹Рµ РѕСЂРіР°РЅРёР·Р°С†РёРё",
                description="Р’С‹ РёР·РјРµРЅРёР»Рё РґР°РЅРЅС‹Рµ РІР°С€РµР№ РѕСЂРіР°РЅРёР·Р°С†РёРё. РќРµРѕР±С…РѕРґРёРјРѕ РїРѕРґР°С‚СЊ СѓРІРµРґРѕРјР»РµРЅРёРµ РІ Р РљРќ РѕР± РёР·РјРµРЅРµРЅРёСЏС….",
                organization_id=organization_id,
            )
            self._create_rkn_change_notification_task(
                task_event_id=task_event.id,
                description=(
                    "Р‘С‹Р»Рё РёР·РјРµРЅРµРЅС‹ РґР°РЅРЅС‹Рµ РѕСЂРіР°РЅРёР·Р°С†РёРё. РќРµРѕР±С…РѕРґРёРјРѕ РїРѕРґР°С‚СЊ СѓРІРµРґРѕРјР»РµРЅРёРµ РІ Р РљРќ РѕР± РёР·РјРµРЅРµРЅРёРё СЃРІРµРґРµРЅРёР№."
                ),
                responsible_employee_id=ispdn.responsible_employee_id,
            )
            created_events.append(self.task_event_repository.get_event_by_id(task_event.id, organization_id) or task_event)
        return created_events

    def _get_ispdn_responsible_employee_id(self, ispdn_id: int, organization_id: int) -> int | None:
        ispdn = self.ispdn_repository.get_by_id(ispdn_id, organization_id)
        return ispdn.responsible_employee_id if ispdn is not None else None

    def _create_rkn_change_notification_task(
        self,
        *,
        task_event_id: int,
        description: str,
        responsible_employee_id: int | None,
    ) -> None:
        self.task_event_repository.create_task_once(
            task_event_id=task_event_id,
            title="РћС‚РїСЂР°РІРєР° СѓРІРµРґРѕРјР»РµРЅРёСЏ РѕР± РёР·РјРµРЅРµРЅРёСЏС… РІ Р РљРќ",
            description=description,
            importance="high",
            status="pending",
            automation_key="send_rkn_change_notification",
            responsible_employee_id=responsible_employee_id,
            deadline=self._rkn_change_deadline(),
        )

    @staticmethod
    def _rkn_change_deadline() -> date:
        return date.today() + timedelta(days=15)

    @staticmethod
    def _ispdn_created_key(ispdn_id: int) -> str:
        return f"ispdn_created:{ispdn_id}"

    @staticmethod
    def _security_level_mismatch_key(ispdn_id: int) -> str:
        return f"security_level_mismatch_without_file:{ispdn_id}"

    @staticmethod
    def _is_comment_required(regulatory_status: str, factual_status: str) -> bool:
        return (regulatory_status == "base_set" and factual_status == "not_implemented") or (
            regulatory_status == "not_base_set" and factual_status == "implemented"
        )

    @staticmethod
    def _has_text(value: str | None) -> bool:
        return bool(value and value.strip())


