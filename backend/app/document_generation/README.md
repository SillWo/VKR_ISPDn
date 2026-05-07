# Document generation

Модуль генерирует `.docx` только по системным шаблонам, которые лежат внутри backend-кода в `app/document_generation/documents/<document_code>/template.docx`.
Пользовательские шаблоны не загружаются через UI или API: это исключает хранение шаблонов в БД и сохраняет предсказуемую структуру документов.

## Устройство

- `core/` содержит контракт `DocumentGenerator`, реестр, сервис и `DocxTemplateRenderer`.
- `context/` содержит `DocumentContextBuilder` и поставщиков данных из модулей платформы.
- `documents/` содержит конкретные системные документы.

`DocumentGenerationService` получает тип документа, `ispdn_id` и ручные данные, находит генератор в `DocumentRegistry`, валидирует данные, собирает контекст через `DocumentContextBuilder` и рендерит шаблон через `docxtpl`.

## Как добавить документ

1. Создать папку `app/document_generation/documents/<document_code>/`.
2. Положить системный шаблон в `template.docx`.
3. Описать Pydantic-схему ручных данных в `schemas.py`.
4. Описать `generator.py`: метаданные, ручные поля, валидацию, сбор контекста и имя файла.
5. Зарегистрировать генератор в `core/registry.py`.

## Context providers

`DocumentContextBuilder` предоставляет методы `system()`, `organization()`, `ispdn(ispdn_id)` и заглушки для будущих модулей. Новый provider подключается в `context/providers/`, затем добавляется в `DocumentContextBuilder`.

## Employee names in documents

Если документу нужен сотрудник компании, frontend должен передавать employee id, а не текстовое ФИО. Генератор получает сотрудника через `DocumentContextBuilder` и сам выбирает формат имени.

Для документов поддерживаются режимы:

- `full_name`;
- `document_initials`.

Для `act_ispdn_commissioning` используется `employee_name_mode = "document_initials"`, поэтому в контекст шаблона `responsible_for_the_event` подставляются инициалы для документов из карточки сотрудника.
