# QA Release Review

## 1. Краткое описание проверки

Проведены code review и smoke QA-аудит ключевых сценариев платформы `VKR_ISPDn`: регистрация и вход, tenant-scoping защищённых endpoint-ов, карточка организации, создание ИСПДн, документы, задачи и несоответствия, уровень защищённости, технические меры защиты, процессы обработки, ЦОД и СКЗИ.

Проверка выполнялась через чтение кода, обязательные backend/frontend checks и HTTP smoke-тесты через `httpx.AsyncClient` с `httpx.ASGITransport`.

## 2. Дата проверки

15 мая 2026.

## 3. Проверенная ветка/коммит

- Ветка: `main`
- Коммит на момент начала проверки: `af303f98ff46275fd0f843d268bc0a171382eb54`
- Рабочее дерево до проверки уже содержало незакоммиченные изменения.

## 4. Список проверенных сценариев

| Сценарий | Статус |
|---|---|
| Регистрация пользователя | Проверено через API |
| Login/logout/me | Проверено через API |
| 401 без токена и с некорректным токеном | Проверено через API |
| Создание организации при регистрации | Проверено через API |
| Карточка организации: юрлицо | Проверено через API |
| Карточка организации: ИП с документом | Проверено, исправлен дефект |
| Создание карточки ИСПДн | Проверено через API |
| Негативные сценарии ИСПДн | Проверено через API |
| Автоматическая задача при создании ИСПДн | Проверено через API |
| Ручные события и задачи | Проверено через API |
| Быстрая смена статуса и важности задачи | Проверено через API |
| Генерация документов | Проверено через API и DOCX zip inspection |
| Уровень защищённости | Проверено через API |
| Технические меры защиты | Проверено через API |
| Процессы обработки | Проверено через API |
| ЦОД и автоматические события | Проверено через API |
| СКЗИ и автоматические события | Проверено через API |
| Frontend routes/navigation/forms | Проверено статически и через `npm run build` |

## 5. Таблица найденных дефектов

| ID | Severity | Area | Steps to reproduce | Expected | Actual | Root cause | Fix applied | Files changed |
|---|---|---|---|---|---|---|---|---|
| QA-001 | Major | Organization / API contract / DB / Frontend validation | Сохранить карточку организации с `operator_type=individual_entrepreneur`, ИНН 12, ОГРНИП 15, `kpp=null`, паспортными данными | Карточка ИП сохраняется, `short_legal_name` и `kpp` не требуются | Backend возвращал 422, frontend требовал реквизиты юрлица | Схемы, модель и UI были настроены только на юрлицо: ИНН 10, ОГРН 13, КПП обязательный | Исправлено | `backend/app/models/organization.py`, `backend/app/schemas/organization.py`, `backend/alembic/versions/20260515_0024_allow_individual_entrepreneur_requisites.py`, `frontend/src/entities/organization/api/organizationApi.ts`, `frontend/src/features/organization-card-form/model/schema.ts` |
| QA-002 | Major | Document generation | Сгенерировать `PDn_document` после заполнения руководителя через `head_employee_id` | Генератор использует должность и ФИО выбранного сотрудника | Генератор требовал старые поля `head_position/head_full_name` и мог возвращать 422 | Provider документа не учитывал новый employee-based контекст руководителя | Исправлено | `backend/app/document_generation/context/providers/pdn_document_provider.py` |

## 6. Список исправленных дефектов

- QA-001: поддержка реквизитов ИП согласована между backend, БД и frontend.
- QA-002: `PDn_document` теперь использует должность руководителя из выбранного сотрудника.

## 7. Список не исправленных дефектов

Не выявлены не исправленные дефекты уровня Blocker/Critical/Major в проверенных smoke-сценариях.

Ограничения проверки:

- Негативный сценарий удаления организации не-owner пользователем не выполнен через публичный API, потому что в проекте нет endpoint-а создания второго пользователя внутри существующей организации.
- Browser E2E не выполнялся: Playwright/Cypress не добавлялись по ограничениям задачи.
- `npm run build` выдаёт предупреждение Vite о размере chunk-а больше 500 kB; сборка успешна.

## 8. Blockers before release

Blocker-ов по результатам проверки не осталось.

## 9. Результаты backend-проверок

| Команда | Результат |
|---|---|
| `python -m compileall app` | PASS |
| `python -c "from app.main import app; print(app.title)"` | PASS |
| `python -m alembic upgrade head` | PASS |

`DATABASE_URL` был задан, Alembic применён до `head`.

## 10. Результаты frontend-проверок

| Команда | Результат |
|---|---|
| `npm run build` | PASS |

Предупреждение: Vite сообщил о крупном production chunk-е, но сборка завершилась успешно.

## 11. Результаты smoke-тестов

Smoke-скрипт: `backend/scripts/qa_smoke_review.py`.

Итог:

```text
SUMMARY | passed=38 failed=0 total=38
```

Проверены:

- регистрация, duplicate username, пустой username, короткий пароль;
- login/me/logout, revoked token, invalid token, no token;
- создание сотрудника;
- карточка организации юрлица и ИП;
- негативные проверки карточки организации;
- создание active и archived ИСПДн;
- негативные проверки ИСПДн;
- document-types, unknown document type, RKN_changes без `change_date`;
- генерация `RKN_notification` с проверкой DOCX на остаточные `{{ }}` и `{% %}`;
- ручные события и задачи;
- запрет ручного события для archived ИСПДн;
- быстрый patch статуса и важности задачи;
- расчёт и сохранение уровня защищённости;
- запрет расхождения actual/recommended без обоснования;
- технические меры без уровня защищённости;
- обязательный комментарий к мере при расхождении статуса;
- создание и повторная привязка процесса обработки;
- ЦОД automation без дублей;
- СКЗИ validation и automation без дублей.

Тестовые данные создавались с префиксом `QA_REVIEW_SMOKE_` и удалялись через удаление тестовой организации.

## 12. Release verdict

Ready with known limitations.

Причина: blocker-ов нет, обязательные проверки и smoke-сценарии прошли, но нет browser E2E и нет публичного сценария для проверки non-owner удаления организации.

