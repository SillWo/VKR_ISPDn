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

    def create_ispdn_created_event(self, ispdn_id: int) -> TaskEvent:
        task_event = self.task_event_repository.create_event_once(
            ispdn_id=ispdn_id,
            event_type="ispdn_created",
            source_module="ispdn_registry",
            title="Создание новой ИСПДн",
            description=(
                "Создана новая ИСПДн, для которой необходимо завершить первичное заполнение контрольных данных."
            ),
            automation_key=self._ispdn_created_key(ispdn_id),
        )
        self.task_event_repository.create_task_once(
            task_event_id=task_event.id,
            title='Заполнение модуля "Технические меры защиты"',
            description=(
                "Вам необходимо указать фактический статус всех мер технической защиты для ИСПДн и заполнить "
                "комментарий, если фактический статус не совпадает с статусом по приказу ФСТЭК №21"
            ),
            importance="high",
            status="pending",
            automation_key="fill_technical_security_measures",
        )
        self.sync_fill_technical_security_measures_task(ispdn_id)
        return self.task_event_repository.get_event_by_id(task_event.id) or task_event

    def create_actual_security_level_changed_event(self, ispdn_id: int) -> TaskEvent:
        task_event = self.task_event_repository.create_event(
            ispdn_id=ispdn_id,
            event_type="actual_security_level_changed",
            source_module="security_level",
            title="Изменение фактического уровня защищённости у ИСПДн",
            description="У ИСПДн был изменён фактический уровень защищённости.",
        )
        self.task_event_repository.create_task_once(
            task_event_id=task_event.id,
            title="Пересмотр технических мер защиты",
            description=(
                "У ИСПДн был изменён фактический уровень защищённости. Вам необходимо актуализировать применяемые "
                "технические меры защиты"
            ),
            importance="high",
            status="pending",
            automation_key="review_technical_security_measures",
        )
        return self.task_event_repository.get_event_by_id(task_event.id) or task_event

    def sync_after_security_level_saved(
        self,
        ispdn_id: int,
        *,
        previous_actual_level: int | None,
        current_actual_level: int,
        had_existing_record: bool,
    ) -> None:
        if had_existing_record and previous_actual_level != current_actual_level:
            self.create_actual_security_level_changed_event(ispdn_id)
        self.sync_security_level_mismatch_without_file(ispdn_id)
        self.sync_fill_technical_security_measures_task(ispdn_id)

    def sync_fill_technical_security_measures_task(self, ispdn_id: int) -> None:
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

        task_event = self.task_event_repository.get_event_by_automation_key(self._ispdn_created_key(ispdn_id))
        if task_event is None:
            return
        task = self.task_event_repository.get_task_by_automation_key(
            task_event.id,
            "fill_technical_security_measures",
        )
        if task is not None and task.status != "done":
            self.task_event_repository.mark_task_done(task)

    def sync_security_level_mismatch_without_file(self, ispdn_id: int) -> None:
        security_level = self.security_level_repository.get_by_ispdn(ispdn_id)
        if security_level is None:
            return

        automation_key = self._security_level_mismatch_key(ispdn_id)
        has_mismatch_without_file = (
            security_level.actual_level != security_level.recommended_level
            and not self._has_text(security_level.deviation_justification_file_path)
        )

        if has_mismatch_without_file:
            task_event = self.task_event_repository.create_event_once(
                ispdn_id=ispdn_id,
                event_type="security_level_mismatch_without_file",
                source_module="security_level",
                title="Фактический уровень защищённости ИСПДн не совпадает с рекомендуемым",
                description=(
                    "Фактический уровень защищённости отличается от рекомендуемого, а файл с обоснованием отсутствует."
                ),
                automation_key=automation_key,
            )
            self.task_event_repository.create_task_once(
                task_event_id=task_event.id,
                title="Добавить обоснование отличия фактического уровня защищённости",
                description=(
                    "У вашей ИСПДн рекомендуемый уровень защищённости по Постановлению правительства №1119 отличается "
                    "от фактического, при это отсутствует документ с обоснованием. Добавьте его в ближайшее время или "
                    "измените фактический уровень защищённости"
                ),
                importance="high",
                status="pending",
                automation_key="add_security_level_deviation_file",
            )
            return

        task_event = self.task_event_repository.get_event_by_automation_key(automation_key)
        if task_event is None:
            return
        task = self.task_event_repository.get_task_by_automation_key(
            task_event.id,
            "add_security_level_deviation_file",
        )
        if task is not None and task.status != "done":
            self.task_event_repository.mark_task_done(task)

    def create_processing_process_created_events(self, process_id: int) -> list[TaskEvent]:
        process = self.processing_process_repository.get_by_id(process_id)
        if process is None:
            return []

        active_ispdns = self.processing_process_repository.list_active_ispdns_for_process(process.id)
        if not active_ispdns:
            return []

        existing_processes = self.processing_process_repository.list_by_purpose_and_period_excluding(
            process.id,
            process.purpose_name,
            process.processing_period,
        )
        if not is_new_processing_process_for_task_automation(process, existing_processes):
            return []

        created_events: list[TaskEvent] = []
        for ispdn in active_ispdns:
            task_event = self.task_event_repository.create_event_once(
                ispdn_id=ispdn.id,
                event_type="processing_process_created",
                source_module="processing_processes",
                title="Создание нового процесса обработки",
                description=(
                    "Новый процесс обработки связан с действующей ИСПДн и требует актуализации документов."
                ),
                automation_key=f"processing_process_created:{ispdn.id}:{process.id}",
            )
            self.task_event_repository.create_task_once(
                task_event_id=task_event.id,
                title="Отправка нового уведомления в РКН",
                description="Вами был создан новый процесс обработки, о котором надо уведомить Роскомнадзор",
                importance="high",
                status="pending",
                automation_key="send_rkn_notification",
            )
            self.task_event_repository.create_task_once(
                task_event_id=task_event.id,
                title="Выпуск нового Положения об обработке персональных данных",
                description=(
                    "Вами был создан новый процесс обработки, который необходимо внести в положение об обработке "
                    "персональных данных. Создайте и выпустите новый документ"
                ),
                importance="medium",
                status="pending",
                automation_key="issue_pdn_processing_policy",
            )
            created_events.append(self.task_event_repository.get_event_by_id(task_event.id) or task_event)
        return created_events

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
