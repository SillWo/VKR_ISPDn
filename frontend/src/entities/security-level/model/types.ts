export type SecurityLevelDataCategoryKey = "special" | "biometric" | "public" | "other";

export type SecurityLevelDataCategories = Record<SecurityLevelDataCategoryKey, boolean>;

export type SubjectCountRange = "more_than_100k" | "less_than_100k";

export type ThreatType = "threat_type_1" | "threat_type_2" | "threat_type_3";

export type SubjectGroup = "clients_only" | "employees_only" | "employees_and_clients";

export type SecurityLevelValue = 1 | 2 | 3 | 4;

export type SecurityLevelCalculationPayload = {
  dataCategories: SecurityLevelDataCategories;
  subjectCountRange: SubjectCountRange | "";
  threatType: ThreatType | "";
  subjectGroup: SubjectGroup | "";
};

export type SecurityLevelCalculationResult = {
  primaryDataCategory: SecurityLevelDataCategoryKey;
  threatType: ThreatType;
  employeeOnly: boolean;
  recommendedLevel: SecurityLevelValue;
};

export type SecurityLevelRecord = SecurityLevelCalculationResult & {
  id: number;
  ispdnId: number;
  dataCategories: SecurityLevelDataCategories;
  subjectCountRange: SubjectCountRange;
  subjectGroup: SubjectGroup;
  actualLevel: SecurityLevelValue;
  actualLevelMatchesRecommended: boolean;
  deviationJustificationText: string | null;
  deviationJustificationFileName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SecurityLevelFormValues = {
  dataCategories: SecurityLevelDataCategories;
  subjectCountRange: SubjectCountRange | "";
  threatType: ThreatType | "";
  subjectGroup: SubjectGroup | "";
  recommendedLevel: SecurityLevelValue | null;
  actualLevel: SecurityLevelValue | "";
  deviationJustificationText: string;
  deviationJustificationFile: File | null;
};

export type SecurityLevelDocumentContext = {
  ispdnId: number;
  dataCategories: string[];
  primaryDataCategory: string;
  subjectCountRange: string;
  threatType: string;
  subjectGroup: string;
  employeeOnly: boolean;
  recommendedLevel: SecurityLevelValue;
  actualLevel: SecurityLevelValue;
  actualLevelMatchesRecommended: boolean;
  deviationJustificationText: string | null;
  deviationJustificationFileName: string | null;
};
