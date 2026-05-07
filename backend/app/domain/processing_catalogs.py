from typing import Literal


CatalogItem = dict[str, str]

SUBJECT_CATEGORY_CATALOG: list[CatalogItem] = [
    {"key": "employees", "label": "Работники"},
    {"key": "applicants", "label": "Соискатели"},
    {"key": "employee_relatives", "label": "Родственники работников"},
    {"key": "former_employees", "label": "Уволенные сотрудники"},
    {"key": "contractors", "label": "Контрагенты"},
    {"key": "contractor_representatives", "label": "Представители контрагентов"},
    {"key": "clients", "label": "Клиенты"},
    {"key": "website_visitors", "label": "Посетители сайта"},
    {"key": "contract_beneficiaries", "label": "Выгодоприобретатели по договорам"},
    {
        "key": "cross_border_consent_subjects",
        "label": "Субъекты, предоставившие согласие на трансграничную передачу ПДн",
    },
    {"key": "school_students", "label": "Учащиеся"},
    {"key": "university_students", "label": "Студенты"},
    {
        "key": "legal_representatives_of_incapacitated_subjects",
        "label": "Законные представители недееспособных субъектов",
    },
]

DATA_CATEGORY_CATALOG: list[CatalogItem] = [
    {"key": "full_name", "label": "Фамилия, имя, отчество"},
    {"key": "birth_year", "label": "Год рождения"},
    {"key": "birth_month", "label": "Месяц рождения"},
    {"key": "birth_date", "label": "Дата рождения"},
    {"key": "birth_place", "label": "Место рождения"},
    {"key": "marital_status", "label": "Семейное положение"},
    {"key": "social_status", "label": "Социальное положение"},
    {"key": "property_status", "label": "Имущественное положение"},
    {"key": "income", "label": "Доходы"},
    {"key": "email", "label": "Адрес электронной почты"},
    {"key": "residential_address", "label": "Адрес места жительства"},
    {"key": "registration_address", "label": "Адрес регистрации"},
    {"key": "phone_number", "label": "Номер телефона"},
    {"key": "snils", "label": "СНИЛС"},
    {"key": "inn", "label": "ИНН"},
    {"key": "citizenship", "label": "Гражданство"},
    {"key": "identity_document", "label": "Данные документа, удостоверяющего личность"},
    {"key": "driver_license", "label": "Данные водительского удостоверения"},
    {
        "key": "foreign_identity_document",
        "label": "Данные документа, удостоверяющего личность за пределами Российской Федерации",
    },
    {"key": "birth_certificate_data", "label": "Данные документа, содержащиеся в свидетельстве о рождении"},
    {"key": "bank_card_details", "label": "Реквизиты банковской карты"},
    {"key": "bank_account_number", "label": "Номер расчетного счета"},
    {"key": "personal_account_number", "label": "Номер лицевого счета"},
    {"key": "profession", "label": "Профессия"},
    {"key": "position", "label": "Должность"},
    {"key": "employment_activity", "label": "Сведения о трудовой деятельности"},
    {"key": "military_registration", "label": "Отношение к воинской обязанности, сведения о воинском учете"},
    {"key": "metrics_program_data", "label": "Сведения, собираемые посредством метрических программ"},
    {"key": "education", "label": "Сведения об образовании"},
    {"key": "photo_video_face_image", "label": "Фото-видео изображение лица"},
    {"key": "personal_voice_data", "label": "Данные голоса человека"},
    {"key": "other_personal_data", "label": "Иные персональные данные"},
    {"key": "health_status", "label": "Сведения о состоянии здоровья"},
    {"key": "nationality", "label": "Национальная принадлежность"},
    {"key": "political_views", "label": "Политические взгляды"},
    {"key": "religious_or_philosophical_beliefs", "label": "Религиозные или философские убеждения"},
    {"key": "criminal_record", "label": "Сведения о судимости"},
    {"key": "biometric_face_image", "label": "Данные изображения лица, полученные с помощью фото- видео устройств"},
    {"key": "biometric_voice_data", "label": "Данные голоса человека"},
    {"key": "fingerprint_patterns", "label": "Изображение папиллярных узоров пальцев рук"},
    {"key": "other_biometric_data", "label": "Иные биометрические персональные данные"},
]

LEGAL_BASIS_CATALOG: list[CatalogItem] = [
    {"key": "subject_consent", "label": "Получение согласия от субъекта"},
    {
        "key": "international_treaty",
        "label": "Осуществление международного договора на основании законодательства РФ",
    },
    {"key": "court_proceedings", "label": "Участие субъекта в судопроизводстве"},
    {"key": "court_decisions", "label": "Исполнение решений суда"},
    {"key": "state_services", "label": "Предоставление государственных услуг"},
    {"key": "contract_obligations", "label": "Исполнение договорных обязательств"},
    {
        "key": "life_and_health_protection",
        "label": "Сохранение жизни и здоровья без возможности получения согласия",
    },
    {
        "key": "operator_or_third_party_interests",
        "label": "Осуществление прав и законных интересов оператора или третьих лиц",
    },
    {"key": "journalism_and_media", "label": "Журналистская деятельность и работа СМИ"},
    {
        "key": "depersonalized_statistics",
        "label": "Обработка обезличенных ПДн для сбора статистики",
    },
    {
        "key": "depersonalized_service_quality",
        "label": "Обработка обезличенных ПДн для повышения качества государственных или муниципальных услуг",
    },
    {"key": "mandatory_disclosure", "label": "Обработка ПДн, которые должны обязательно раскрываться"},
]

PERSONAL_DATA_ACTION_CATALOG: list[CatalogItem] = [
    {"key": "collection", "label": "Сбор"},
    {"key": "recording", "label": "Запись"},
    {"key": "systematization", "label": "Систематизация"},
    {"key": "accumulation", "label": "Накопление"},
    {"key": "storage", "label": "Хранение"},
    {"key": "update", "label": "Уточнение (обновление, изменение)"},
    {"key": "retrieval", "label": "Извлечение"},
    {"key": "use", "label": "Использование"},
    {"key": "transfer", "label": "Передача (предоставление, доступ)"},
    {"key": "depersonalization", "label": "Обезличивание"},
    {"key": "blocking", "label": "Блокирование"},
    {"key": "deletion", "label": "Удаление"},
    {"key": "destruction", "label": "Уничтожение"},
    {"key": "distribution", "label": "Распространение"},
    {"key": "other_actions", "label": "Иные действия"},
]

ProcessingType = Literal["automated", "non_automated", "mixed"]
InternalNetworkTransfer = Literal["no_internal_network_transfer", "with_internal_network_transfer"]
InternetTransfer = Literal["no_internet_transfer", "with_internet_transfer"]

PROCESSING_TYPE_LABELS: dict[str, str] = {
    "automated": "Автоматизированная",
    "non_automated": "Неавтоматизированная",
    "mixed": "Смешанная",
}

INTERNAL_NETWORK_TRANSFER_LABELS: dict[str, str] = {
    "no_internal_network_transfer": "Без передачи по внутренней сети юридического лица",
    "with_internal_network_transfer": "С передачей по внутренней сети юридического лица",
}

INTERNET_TRANSFER_LABELS: dict[str, str] = {
    "no_internet_transfer": "Без передачи по сети Интернет",
    "with_internet_transfer": "С передачей по сети Интернет",
}


def get_catalog_keys(catalog: list[CatalogItem]) -> set[str]:
    return {item["key"] for item in catalog}


def selected_labels(values: dict[str, bool | str], catalog: list[CatalogItem]) -> list[str]:
    labels: list[str] = []
    for item in catalog:
        value = values.get(item["key"])
        if value is True:
            labels.append(item["label"])
        elif isinstance(value, str) and value.strip():
            labels.append(value.strip())
    return labels
