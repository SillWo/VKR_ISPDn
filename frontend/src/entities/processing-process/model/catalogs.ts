export type CatalogItem = {
  key: string;
  label: string;
};

export type CatalogGroup = {
  title: string;
  items: CatalogItem[];
  textItems?: CatalogItem[];
};

export const subjectCategoryCatalog: CatalogItem[] = [
  { key: "employees", label: "Работники" },
  { key: "applicants", label: "Соискатели" },
  { key: "employee_relatives", label: "Родственники работников" },
  { key: "former_employees", label: "Уволенные сотрудники" },
  { key: "contractors", label: "Контрагенты" },
  { key: "contractor_representatives", label: "Представители контрагентов" },
  { key: "clients", label: "Клиенты" },
  { key: "website_visitors", label: "Посетители сайта" },
  { key: "contract_beneficiaries", label: "Выгодоприобретатели по договорам" },
  {
    key: "cross_border_consent_subjects",
    label: "Субъекты, предоставившие согласие на трансграничную передачу ПДн",
  },
  { key: "school_students", label: "Учащиеся" },
  { key: "university_students", label: "Студенты" },
  {
    key: "legal_representatives_of_incapacitated_subjects",
    label: "Законные представители недееспособных субъектов",
  },
];

export const dataCategoryCatalog: CatalogItem[] = [
  { key: "full_name", label: "Фамилия, имя, отчество" },
  { key: "birth_year", label: "Год рождения" },
  { key: "birth_month", label: "Месяц рождения" },
  { key: "birth_date", label: "Дата рождения" },
  { key: "birth_place", label: "Место рождения" },
  { key: "marital_status", label: "Семейное положение" },
  { key: "social_status", label: "Социальное положение" },
  { key: "property_status", label: "Имущественное положение" },
  { key: "income", label: "Доходы" },
  { key: "email", label: "Адрес электронной почты" },
  { key: "residential_address", label: "Адрес места жительства" },
  { key: "registration_address", label: "Адрес регистрации" },
  { key: "phone_number", label: "Номер телефона" },
  { key: "snils", label: "СНИЛС" },
  { key: "inn", label: "ИНН" },
  { key: "citizenship", label: "Гражданство" },
  { key: "identity_document", label: "Данные документа, удостоверяющего личность" },
  { key: "driver_license", label: "Данные водительского удостоверения" },
  {
    key: "foreign_identity_document",
    label: "Данные документа, удостоверяющего личность за пределами Российской Федерации",
  },
  { key: "birth_certificate_data", label: "Данные документа, содержащиеся в свидетельстве о рождении" },
  { key: "bank_card_details", label: "Реквизиты банковской карты" },
  { key: "bank_account_number", label: "Номер расчетного счета" },
  { key: "personal_account_number", label: "Номер лицевого счета" },
  { key: "profession", label: "Профессия" },
  { key: "position", label: "Должность" },
  { key: "employment_activity", label: "Сведения о трудовой деятельности" },
  { key: "military_registration", label: "Отношение к воинской обязанности, сведения о воинском учете" },
  { key: "metrics_program_data", label: "Сведения, собираемые посредством метрических программ" },
  { key: "education", label: "Сведения об образовании" },
  { key: "photo_video_face_image", label: "Фото-видео изображение лица" },
  { key: "personal_voice_data", label: "Данные голоса человека" },
  { key: "other_personal_data", label: "Иные персональные данные" },
  { key: "health_status", label: "Сведения о состоянии здоровья" },
  { key: "nationality", label: "Национальная принадлежность" },
  { key: "political_views", label: "Политические взгляды" },
  { key: "religious_or_philosophical_beliefs", label: "Религиозные или философские убеждения" },
  { key: "criminal_record", label: "Сведения о судимости" },
  { key: "biometric_face_image", label: "Данные изображения лица, полученные с помощью фото- видео устройств" },
  { key: "biometric_voice_data", label: "Данные голоса человека" },
  { key: "fingerprint_patterns", label: "Изображение папиллярных узоров пальцев рук" },
  { key: "other_biometric_data", label: "Иные биометрические персональные данные" },
];

export const dataCategoryGroups: CatalogGroup[] = [
  {
    title: "Персональные данные",
    items: dataCategoryCatalog.slice(0, 31),
    textItems: [dataCategoryCatalog[31]],
  },
  {
    title: "Специальные категории персональных данных",
    items: dataCategoryCatalog.slice(32, 37),
  },
  {
    title: "Биометрические персональные данные",
    items: dataCategoryCatalog.slice(37, 40),
    textItems: [dataCategoryCatalog[40]],
  },
];

export const legalBasisCatalog: CatalogItem[] = [
  { key: "subject_consent", label: "Получение согласия от субъекта" },
  { key: "international_treaty", label: "Осуществление международного договора на основании законодательства РФ" },
  { key: "court_proceedings", label: "Участие субъекта в судопроизводстве" },
  { key: "court_decisions", label: "Исполнение решений суда" },
  { key: "state_services", label: "Предоставление государственных услуг" },
  { key: "contract_obligations", label: "Исполнение договорных обязательств" },
  { key: "life_and_health_protection", label: "Сохранение жизни и здоровья без возможности получения согласия" },
  {
    key: "operator_or_third_party_interests",
    label: "Осуществление прав и законных интересов оператора или третьих лиц",
  },
  { key: "journalism_and_media", label: "Журналистская деятельность и работа СМИ" },
  { key: "depersonalized_statistics", label: "Обработка обезличенных ПДн для сбора статистики" },
  {
    key: "depersonalized_service_quality",
    label: "Обработка обезличенных ПДн для повышения качества государственных или муниципальных услуг",
  },
  { key: "mandatory_disclosure", label: "Обработка ПДн, которые должны обязательно раскрываться" },
];

export const personalDataActionCatalog: CatalogItem[] = [
  { key: "collection", label: "Сбор" },
  { key: "recording", label: "Запись" },
  { key: "systematization", label: "Систематизация" },
  { key: "accumulation", label: "Накопление" },
  { key: "storage", label: "Хранение" },
  { key: "update", label: "Уточнение (обновление, изменение)" },
  { key: "retrieval", label: "Извлечение" },
  { key: "use", label: "Использование" },
  { key: "transfer", label: "Передача (предоставление, доступ)" },
  { key: "depersonalization", label: "Обезличивание" },
  { key: "blocking", label: "Блокирование" },
  { key: "deletion", label: "Удаление" },
  { key: "destruction", label: "Уничтожение" },
  { key: "distribution", label: "Распространение" },
  { key: "other_actions", label: "Иные действия" },
];

export const processingTypeOptions = [
  { value: "automated", label: "Автоматизированная" },
  { value: "non_automated", label: "Неавтоматизированная" },
  { value: "mixed", label: "Смешанная" },
] as const;

export const internalNetworkTransferOptions = [
  { value: "no_internal_network_transfer", label: "Без передачи по внутренней сети юридического лица" },
  { value: "with_internal_network_transfer", label: "С передачей по внутренней сети юридического лица" },
] as const;

export const internetTransferOptions = [
  { value: "no_internet_transfer", label: "Без передачи по сети Интернет" },
  { value: "with_internet_transfer", label: "С передачей по сети Интернет" },
] as const;

export type ProcessingType = (typeof processingTypeOptions)[number]["value"];
export type InternalNetworkTransfer = (typeof internalNetworkTransferOptions)[number]["value"];
export type InternetTransfer = (typeof internetTransferOptions)[number]["value"];

export function createEmptySwitchValues(catalog: CatalogItem[]) {
  return Object.fromEntries(catalog.map((item) => [item.key, false])) as Record<string, boolean>;
}

export function createEmptyPersonalDataActionValues() {
  return Object.fromEntries(
    personalDataActionCatalog.map((item) => [item.key, item.key === "other_actions" ? "" : false]),
  ) as Record<string, boolean | string>;
}

export function createEmptyDataCategoryValues() {
  return Object.fromEntries(
    dataCategoryCatalog.map((item) => [
      item.key,
      item.key === "other_personal_data" || item.key === "other_biometric_data" ? "" : false,
    ]),
  ) as Record<string, boolean | string>;
}

export function mergeSwitchValues(catalog: CatalogItem[], values?: Record<string, boolean | string>) {
  return Object.fromEntries(catalog.map((item) => [item.key, values?.[item.key] === true])) as Record<string, boolean>;
}

export function mergePersonalDataActionValues(values?: Record<string, boolean | string>) {
  return Object.fromEntries(
    personalDataActionCatalog.map((item) => [
      item.key,
      item.key === "other_actions" ? String(values?.[item.key] ?? "") : values?.[item.key] === true,
    ]),
  ) as Record<string, boolean | string>;
}

export function mergeDataCategoryValues(values?: Record<string, boolean | string>) {
  return Object.fromEntries(
    dataCategoryCatalog.map((item) => [
      item.key,
      item.key === "other_personal_data" || item.key === "other_biometric_data"
        ? String(values?.[item.key] ?? "")
        : values?.[item.key] === true,
    ]),
  ) as Record<string, boolean | string>;
}

export function selectedCatalogLabels(catalog: CatalogItem[], values: Record<string, boolean | string>) {
  return catalog
    .filter((item) => values[item.key] === true || (typeof values[item.key] === "string" && values[item.key] !== ""))
    .map((item) => (typeof values[item.key] === "string" ? String(values[item.key]) : item.label));
}
