"""fix task automation text encoding

Revision ID: 20260515_0025
Revises: 20260515_0024
Create Date: 2026-05-15 10:45:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260515_0025"
down_revision: str | None = "20260515_0024"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


EVENT_TEXTS = {
    "ispdn_created": (
        "Создание новой ИСПДн",
        "Создана новая ИСПДн, для которой необходимо завершить первичное заполнение контрольных данных.",
    ),
    "actual_security_level_changed": (
        "Изменение фактического уровня защищённости у ИСПДн",
        "У ИСПДн был изменён фактический уровень защищённости.",
    ),
    "security_level_mismatch_without_file": (
        "Фактический уровень защищённости ИСПДн не совпадает с рекомендуемым",
        "Фактический уровень защищённости отличается от рекомендуемого, а файл с обоснованием отсутствует.",
    ),
    "processing_process_created": (
        "Создание нового процесса обработки",
        "Новый процесс обработки связан с действующей ИСПДн и требует актуализации документов.",
    ),
    "crypto_tool_added_to_active_ispdn": (
        "Появление нового СКЗИ у действующей ИСПДн",
        "Вы указали использование нового СКЗИ в одной из действующих ИСПДн. Необходимо подать "
        "уведомление в РКН об использовании нового СКЗИ при обработке ПДн.",
    ),
    "data_center_added_to_active_ispdn": (
        "Появление нового ЦОД у действующей ИСПДн",
        "Вы указали использование нового ЦОД в одной из действующих ИСПДн. Необходимо подать уведомление "
        "в РКН об использовании нового ЦОД при обработке ПДн.",
    ),
    "organization_data_changed": (
        "Изменились данные организации",
        "Вы изменили данные вашей организации. Необходимо подать уведомление в РКН об изменениях.",
    ),
}


TASK_TEXTS = {
    "fill_technical_security_measures": (
        'Заполнение модуля "Технические меры защиты"',
        "Вам необходимо указать фактический статус всех мер технической защиты для ИСПДн и заполнить "
        "комментарий, если фактический статус не совпадает со статусом по приказу ФСТЭК №21",
    ),
    "review_technical_security_measures": (
        "Пересмотр технических мер защиты",
        "У ИСПДн был изменён фактический уровень защищённости. Вам необходимо актуализировать применяемые "
        "технические меры защиты",
    ),
    "add_security_level_deviation_file": (
        "Добавить обоснование отличия фактического уровня защищённости",
        "У вашей ИСПДн рекомендуемый уровень защищённости по Постановлению правительства №1119 отличается "
        "от фактического, при этом отсутствует документ с обоснованием. Добавьте его в ближайшее время или "
        "измените фактический уровень защищённости",
    ),
    "issue_pdn_processing_policy": (
        "Выпуск нового Положения об обработке персональных данных",
        "Вами был создан новый процесс обработки, который необходимо внести в положение об обработке "
        "персональных данных. Создайте и выпустите новый документ",
    ),
}


RKN_TASK_DESCRIPTIONS = {
    "processing_process_created": (
        "Вами был создан новый процесс обработки, о котором необходимо уведомить Роскомнадзор через "
        "уведомление об изменении сведений."
    ),
    "crypto_tool_added_to_active_ispdn": (
        "В ИСПДн было добавлено новое СКЗИ. Необходимо подать уведомление в РКН об изменении сведений."
    ),
    "data_center_added_to_active_ispdn": (
        "В ИСПДн был добавлен новый ЦОД. Необходимо подать уведомление в РКН об изменении сведений."
    ),
    "organization_data_changed": (
        "Были изменены данные организации. Необходимо подать уведомление в РКН об изменении сведений."
    ),
}


def upgrade() -> None:
    connection = op.get_bind()

    for event_type, (title, description) in EVENT_TEXTS.items():
        connection.execute(
            sa.text(
                """
                UPDATE task_events
                SET title = :title,
                    description = :description
                WHERE event_type = :event_type
                  AND source_module != 'manual'
                """
            ),
            {"event_type": event_type, "title": title, "description": description},
        )

    for automation_key, (title, description) in TASK_TEXTS.items():
        connection.execute(
            sa.text(
                """
                UPDATE tasks
                SET title = :title,
                    description = :description
                WHERE automation_key = :automation_key
                """
            ),
            {"automation_key": automation_key, "title": title, "description": description},
        )

    for event_type, description in RKN_TASK_DESCRIPTIONS.items():
        connection.execute(
            sa.text(
                """
                UPDATE tasks
                SET title = :title,
                    description = :description
                FROM task_events
                WHERE tasks.task_event_id = task_events.id
                  AND tasks.automation_key = 'send_rkn_change_notification'
                  AND task_events.event_type = :event_type
                """
            ),
            {
                "event_type": event_type,
                "title": "Отправка уведомления об изменениях в РКН",
                "description": description,
            },
        )


def downgrade() -> None:
    pass
