import type {
  SecurityLevelDataCategories,
  SecurityLevelDataCategoryKey,
  SecurityLevelValue,
  SubjectCountRange,
  SubjectGroup,
  ThreatType,
} from "./types";

export const dataCategoryOptions: readonly { value: SecurityLevelDataCategoryKey; label: string }[] = [
  { value: "special", label: "Специальные" },
  { value: "biometric", label: "Биометрические" },
  { value: "public", label: "Из общедоступных источников" },
  { value: "other", label: "Иные" },
];

export const subjectCountRangeOptions: readonly { value: SubjectCountRange; label: string }[] = [
  { value: "more_than_100k", label: "более чем 100 000 субъектов персональных данных" },
  { value: "less_than_100k", label: "менее чем 100 000 субъектов персональных данных" },
];

export const threatTypeOptions: readonly { value: ThreatType; label: string }[] = [
  { value: "threat_type_1", label: "1 тип угроз" },
  { value: "threat_type_2", label: "2 тип угроз" },
  { value: "threat_type_3", label: "3 тип угроз" },
];

export const subjectGroupOptions: readonly { value: SubjectGroup; label: string }[] = [
  { value: "clients_only", label: "только клиенты" },
  { value: "employees_only", label: "только сотрудники" },
  { value: "employees_and_clients", label: "и работники и сотрудники" },
];

export const securityLevelOptions: readonly { value: SecurityLevelValue; label: string }[] = [
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
];

export const threatTypeLabels: Record<ThreatType, string> = {
  threat_type_1: "1 тип угроз",
  threat_type_2: "2 тип угроз",
  threat_type_3: "3 тип угроз",
};

export const createEmptySecurityLevelDataCategories = (): SecurityLevelDataCategories => ({
  special: false,
  biometric: false,
  public: false,
  other: false,
});

export function labelByValue<TValue extends string | number>(
  options: readonly { value: TValue; label: string }[],
  value: TValue | "" | null | undefined,
) {
  if (value === "" || value === null || value === undefined) {
    return "Не выбрано";
  }
  return options.find((option) => option.value === value)?.label ?? String(value);
}
