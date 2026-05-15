import { authHeaders, buildApiUrl, httpClient } from "../../../shared/api/httpClient";
import type {
  SecurityLevelCalculationPayload,
  SecurityLevelCalculationResult,
  SecurityLevelDocumentContext,
  SecurityLevelFormValues,
  SecurityLevelRecord,
  SecurityLevelValue,
  SubjectCountRange,
  SubjectGroup,
  ThreatType,
} from "../model/types";

type SecurityLevelDataCategoriesDto = {
  special: boolean;
  biometric: boolean;
  public: boolean;
  other: boolean;
};

type SecurityLevelRecordDto = {
  id: number;
  ispdn_id: number;
  data_categories: SecurityLevelDataCategoriesDto;
  primary_data_category: "special" | "biometric" | "public" | "other";
  subject_count_range: SubjectCountRange;
  threat_type: ThreatType;
  subject_group: SubjectGroup;
  employee_only: boolean;
  recommended_level: SecurityLevelValue;
  actual_level: SecurityLevelValue;
  actual_level_matches_recommended: boolean;
  deviation_justification_text: string | null;
  deviation_justification_file_name: string | null;
  created_at: string;
  updated_at: string;
};

type SecurityLevelCalculationResultDto = {
  primary_data_category: "special" | "biometric" | "public" | "other";
  threat_type: ThreatType;
  employee_only: boolean;
  recommended_level: SecurityLevelValue;
};

type SecurityLevelCalculationPayloadDto = {
  data_categories: SecurityLevelDataCategoriesDto;
  subject_count_range: SubjectCountRange;
  threat_type: ThreatType;
  subject_group: SubjectGroup;
};

type SecurityLevelDocumentContextDto = {
  ispdn_id: number;
  data_categories: string[];
  primary_data_category: string;
  subject_count_range: string;
  threat_type: string;
  subject_group: string;
  employee_only: boolean;
  recommended_level: SecurityLevelValue;
  actual_level: SecurityLevelValue;
  actual_level_matches_recommended: boolean;
  deviation_justification_text: string | null;
  deviation_justification_file_name: string | null;
};

function mapCalculationResult(dto: SecurityLevelCalculationResultDto): SecurityLevelCalculationResult {
  return {
    primaryDataCategory: dto.primary_data_category,
    threatType: dto.threat_type,
    employeeOnly: dto.employee_only,
    recommendedLevel: dto.recommended_level,
  };
}

function mapRecord(dto: SecurityLevelRecordDto): SecurityLevelRecord {
  return {
    id: dto.id,
    ispdnId: dto.ispdn_id,
    dataCategories: dto.data_categories,
    primaryDataCategory: dto.primary_data_category,
    subjectCountRange: dto.subject_count_range,
    threatType: dto.threat_type,
    subjectGroup: dto.subject_group,
    employeeOnly: dto.employee_only,
    recommendedLevel: dto.recommended_level,
    actualLevel: dto.actual_level,
    actualLevelMatchesRecommended: dto.actual_level_matches_recommended,
    deviationJustificationText: dto.deviation_justification_text,
    deviationJustificationFileName: dto.deviation_justification_file_name,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

function mapDocumentContext(dto: SecurityLevelDocumentContextDto): SecurityLevelDocumentContext {
  return {
    ispdnId: dto.ispdn_id,
    dataCategories: dto.data_categories,
    primaryDataCategory: dto.primary_data_category,
    subjectCountRange: dto.subject_count_range,
    threatType: dto.threat_type,
    subjectGroup: dto.subject_group,
    employeeOnly: dto.employee_only,
    recommendedLevel: dto.recommended_level,
    actualLevel: dto.actual_level,
    actualLevelMatchesRecommended: dto.actual_level_matches_recommended,
    deviationJustificationText: dto.deviation_justification_text,
    deviationJustificationFileName: dto.deviation_justification_file_name,
  };
}

function mapCalculationPayload(payload: SecurityLevelCalculationPayload): SecurityLevelCalculationPayloadDto {
  if (!payload.subjectCountRange || !payload.threatType || !payload.subjectGroup) {
    throw new Error("Security level calculation payload is incomplete");
  }

  return {
    data_categories: payload.dataCategories,
    subject_count_range: payload.subjectCountRange,
    threat_type: payload.threatType,
    subject_group: payload.subjectGroup,
  };
}

function mapFormData(values: SecurityLevelFormValues) {
  if (!values.subjectCountRange || !values.threatType || !values.subjectGroup || !values.actualLevel) {
    throw new Error("Security level form is incomplete");
  }

  const formData = new FormData();
  formData.append("data_categories", JSON.stringify(values.dataCategories));
  formData.append("subject_count_range", values.subjectCountRange);
  formData.append("threat_type", values.threatType);
  formData.append("subject_group", values.subjectGroup);
  formData.append("actual_level", String(values.actualLevel));
  if (values.deviationJustificationText.trim()) {
    formData.append("deviation_justification_text", values.deviationJustificationText.trim());
  }
  if (values.deviationJustificationFile) {
    formData.append("deviation_justification_file", values.deviationJustificationFile);
  }
  return formData;
}

export function getIspdnSecurityLevel(ispdnId: number) {
  return httpClient<SecurityLevelRecordDto>(`/api/v1/ispdns/${ispdnId}/security-level`).then(mapRecord);
}

export function calculateIspdnSecurityLevel(ispdnId: number, payload: SecurityLevelCalculationPayload) {
  return httpClient<SecurityLevelCalculationResultDto>(`/api/v1/ispdns/${ispdnId}/security-level/calculate`, {
    method: "POST",
    body: JSON.stringify(mapCalculationPayload(payload)),
  }).then(mapCalculationResult);
}

export function saveIspdnSecurityLevel(ispdnId: number, payload: SecurityLevelFormValues) {
  return httpClient<SecurityLevelRecordDto>(`/api/v1/ispdns/${ispdnId}/security-level`, {
    method: "PUT",
    body: mapFormData(payload),
  }).then(mapRecord);
}

export function getIspdnSecurityLevelDocumentContext(ispdnId: number) {
  return httpClient<SecurityLevelDocumentContextDto>(
    `/api/v1/ispdns/${ispdnId}/security-level/document-context`,
  ).then(mapDocumentContext);
}

export async function downloadSecurityLevelJustificationFile(ispdnId: number) {
  const response = await fetch(buildApiUrl(`/api/v1/ispdns/${ispdnId}/security-level/justification-file`), {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.blob();
}
