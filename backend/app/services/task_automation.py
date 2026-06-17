from datetime import date, timedelta

from app.domain.fstek21_measures import FSTEK21_MEASURES, get_measure_regulatory_status
from app.domain.processing_process_subsumption import is_new_processing_process_for_task_automation
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

    def create_first_steps_event(self, organization_id: int, *, commit: bool = True) -> TaskEvent:
        task_event = self.task_event_repository.create_event_once(
            ispdn_id=None,
            event_type="first_steps",
            source_module="auth",
            title="Первые шаги",
            description="Вы только что зарегистрировали свой аккаунт, надо заполнить базовые сведения.",
            automation_key=self._first_steps_key(organization_id),
            organization_id=organization_id,
            commit=commit,
        )
        self.task_event_repository.create_task_once(
            task_event_id=task_event.id,
            title="Заполнение карточки организации",
            description="Вам необходимо заполнить информацию о вашей организации.",
            importance="high",
            status="pending",
            automation_key="fill_organization_card",
            responsible_employee_id=None,
            deadline=None,
            commit=commit,
        )
        self.task_event_repository.create_task_once(
            task_event_id=task_event.id,
            title="Создание первой ИСПДн",
            description="Добавьте вашу первую ИСПДн в систему.",
            importance=None,
            status="pending",
            automation_key="create_first_ispdn",
            responsible_employee_id=None,
            deadline=None,
            commit=commit,
        )
        return self.task_event_repository.get_event_by_id(task_event.id, organization_id) or task_event

    def sync_first_steps_tasks(self, organization_id: int) -> None:
        self.sync_fill_organization_card_task(organization_id)
        self.sync_create_first_ispdn_task(organization_id)

    def sync_fill_organization_card_task(self, organization_id: int) -> None:
        self._mark_first_steps_task_done(organization_id, "fill_organization_card")

    def sync_create_first_ispdn_task(self, organization_id: int) -> None:
        if not self.ispdn_repository.list(organization_id):
            return
        self._mark_first_steps_task_done(organization_id, "create_first_ispdn")

    def create_ispdn_created_event(self, ispdn_id: int, organization_id: int) -> TaskEvent:
        responsible_employee_id = self._get_ispdn_responsible_employee_id(ispdn_id, organization_id)
        task_event = self.task_event_repository.create_event_once(
            ispdn_id=ispdn_id,
            event_type="ispdn_created",
            source_module="ispdn_registry",
            title="Создание новой ИСПДн",
            description=(
                "Создана новая ИСПДн, для которой необходимо завершить первичное заполнение контрольных данных."
            ),
            automation_key=self._ispdn_created_key(ispdn_id),
            organization_id=organization_id,
        )
        self.task_event_repository.create_task_once(
            task_event_id=task_event.id,
            title='Заполнение модуля "Технические меры защиты"',
            description=(
                "Вам необходимо указать фактический статус всех мер технической защиты для ИСПДн и заполнить "
                "комментарий, если фактический статус не совпадает со статусом по приказу ФСТЭК №21"
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
            title="Изменение фактического уровня защищённости у ИСПДн",
            description="У ИСПДн был изменён фактический уровень защищённости.",
            organization_id=organization_id,
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
                title="Фактический уровень защищённости ИСПДн не совпадает с рекомендуемым",
                description=(
                    "Фактический уровень защищённости отличается от рекомендуемого, а файл с обоснованием отсутствует."
                ),
                automation_key=automation_key,
                organization_id=organization_id,
            )
            self.task_event_repository.create_task_once(
                task_event_id=task_event.id,
                title="Добавить обоснование отличия фактического уровня защищённости",
                description=(
                    "У вашей ИСПДн рекомендуемый уровень защищённости по Постановлению правительства №1119 отличается "
                    "от фактического, при этом отсутствует документ с обоснованием. Добавьте его в ближайшее время или "
                    "измените фактический уровень защищённости"
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
                title="Создание нового процесса обработки",
                description=(
                    "Новый процесс обработки связан с действующей ИСПДн и требует актуализации документов."
                ),
                automation_key=f"processing_process_created:{ispdn.id}:{process.id}",
                organization_id=organization_id,
            )
            self._create_rkn_change_notification_task(
                task_event_id=task_event.id,
                description=(
                    "Вами был создан новый процесс обработки, о котором необходимо уведомить Роскомнадзор через "
                    "уведомление об изменении сведений."
                ),
                responsible_employee_id=responsible_employee_id,
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
                title="Появление нового СКЗИ у действующей ИСПДн",
                description=(
                    "Вы указали использование нового СКЗИ в одной из действующих ИСПДн. Необходимо подать "
                    "уведомление в РКН об использовании нового СКЗИ при обработке ПДн."
                ),
                automation_key=f"crypto_tool_added_to_active_ispdn:{ispdn.id}:{crypto_tool_id}",
                organization_id=organization_id,
            )
            self._create_rkn_change_notification_task(
                task_event_id=task_event.id,
                description=(
                    "В ИСПДн было добавлено новое СКЗИ. Необходимо подать уведомление в РКН об изменении сведений."
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
                title="Появление нового ЦОД у действующей ИСПДн",
                description=(
                    "Вы указали использование нового ЦОД в одной из действующих ИСПДн. Необходимо подать уведомление "
                    "в РКН об использовании нового ЦОД при обработке ПДн."
                ),
                automation_key=f"data_center_added_to_active_ispdn:{ispdn.id}:{data_center_id}",
                organization_id=organization_id,
            )
            self._create_rkn_change_notification_task(
                task_event_id=task_event.id,
                description=(
                    "В ИСПДн был добавлен новый ЦОД. Необходимо подать уведомление в РКН об изменении сведений."
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
                title="Изменились данные организации",
                description="Вы изменили данные вашей организации. Необходимо подать уведомление в РКН об изменениях.",
                organization_id=organization_id,
            )
            self._create_rkn_change_notification_task(
                task_event_id=task_event.id,
                description=(
                    "Были изменены данные организации. Необходимо подать уведомление в РКН об изменении сведений."
                ),
                responsible_employee_id=ispdn.responsible_employee_id,
            )
            created_events.append(self.task_event_repository.get_event_by_id(task_event.id, organization_id) or task_event)
        return created_events

    def create_personal_data_processing_responsible_changed_event(
        self,
        organization_id: int,
        responsible_employee_id: int | None,
    ) -> TaskEvent:
        task_title = "Выпустить приказ о назначении ответственного за обработку ПДн"
        task_event = self.task_event_repository.create_event(
            ispdn_id=None,
            event_type="personal_data_processing_responsible_changed",
            source_module="organization",
            title="Изменение ответственного за обработку ПДн",
            description="Вы изменили ответственного за обработку ПДн в организации",
            organization_id=organization_id,
        )
        self.task_event_repository.create_task_once(
            task_event_id=task_event.id,
            title=task_title,
            description=task_title,
            importance="high",
            status="pending",
            automation_key="issue_personal_data_processing_responsible_order",
            responsible_employee_id=responsible_employee_id,
        )
        return self.task_event_repository.get_event_by_id(task_event.id, organization_id) or task_event

    def create_ispdn_personal_data_security_responsible_changed_event(
        self,
        ispdn_id: int,
        organization_id: int,
        responsible_employee_id: int | None,
    ) -> TaskEvent | None:
        ispdn = self.ispdn_repository.get_by_id(ispdn_id, organization_id)
        if ispdn is None:
            return None

        task_title = "Выпустить приказ о назначении ответственного за безопасность ПДн"
        event_title = f"Изменение ответственного за безопасность ПДн в {ispdn.name}"
        event_description = f"Вы изменили ответственного за безопасность ПДн в {ispdn.name}"
        task_event = self.task_event_repository.create_event(
            ispdn_id=ispdn.id,
            event_type="ispdn_personal_data_security_responsible_changed",
            source_module="ispdn_registry",
            title=event_title,
            description=event_description,
            organization_id=organization_id,
        )
        self.task_event_repository.create_task_once(
            task_event_id=task_event.id,
            title=task_title,
            description=task_title,
            importance="high",
            status="pending",
            automation_key="issue_ispdn_personal_data_security_responsible_order",
            responsible_employee_id=responsible_employee_id,
        )
        return self.task_event_repository.get_event_by_id(task_event.id, organization_id) or task_event

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
            title="Отправка уведомления об изменениях в РКН",
            description=description,
            importance="high",
            status="pending",
            automation_key="send_rkn_change_notification",
            responsible_employee_id=responsible_employee_id,
            deadline=self._rkn_change_deadline(),
        )

    def _mark_first_steps_task_done(self, organization_id: int, automation_key: str) -> None:
        task_event = self.task_event_repository.get_event_by_automation_key(
            self._first_steps_key(organization_id),
            organization_id,
        )
        if task_event is None:
            return
        task = self.task_event_repository.get_task_by_automation_key(task_event.id, automation_key)
        if task is not None and task.status != "done":
            self.task_event_repository.mark_task_done(task)

    @staticmethod
    def _rkn_change_deadline() -> date:
        return date.today() + timedelta(days=15)

    @staticmethod
    def _ispdn_created_key(ispdn_id: int) -> str:
        return f"ispdn_created:{ispdn_id}"

    @staticmethod
    def _first_steps_key(organization_id: int) -> str:
        return f"first_steps:{organization_id}"

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
