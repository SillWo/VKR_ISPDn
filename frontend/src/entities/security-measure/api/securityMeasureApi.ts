import { authHeaders, buildApiUrl, httpClient } from "../../../shared/api/httpClient";
import type {
  IspdnSecurityTools,
  TechnicalSecurityMeasure,
  TechnicalSecurityMeasureDocument,
  TechnicalSecurityMeasureUpdatePayload,
  TechnicalSecurityMeasuresTable,
} from "../model/types";

type IspdnSecurityToolsDto = {
  dlp: boolean;
  siem: boolean;
  antivirus: boolean;
  ips_ids: boolean;
  firewall_utm_ngfw: boolean;
  vulnerability_scanner: boolean;
  backup_system: boolean;
  trusted_boot: boolean;
  access_control: boolean;
  physical_security: boolean;
  other_security_tools: string | null;
};

type TechnicalSecurityMeasureDto = {
  code: string;
  section_code: string;
  section_title: string;
  content: string;
  security_level: 1 | 2 | 3 | 4;
  regulatory_status: "base_set" | "not_base_set";
  regulatory_status_label: string;
  factual_status: "implemented" | "not_implemented";
  factual_status_label: string;
  comment_required: boolean;
  comment: string | null;
  has_comment: boolean;
  updated_at: string | null;
};

type TechnicalSecurityMeasuresTableDto = {
  ispdn_id: number;
  recommended_level: 1 | 2 | 3 | 4;
  actual_level: 1 | 2 | 3 | 4;
  actual_level_matches_recommended: boolean;
  items: TechnicalSecurityMeasureDto[];
  summary: {
    total_count: number;
    base_set_count: number;
    not_base_set_count: number;
    implemented_count: number;
    not_implemented_count: number;
    base_set_implemented_count: number;
    base_set_not_implemented_count: number;
    base_set_rejected_count: number;
    comment_required_count: number;
    comment_not_required_count: number;
    missing_required_comment_count: number;
  };
};

type TechnicalSecurityMeasureDocumentDto = {
  id: number;
  ispdn_id: number;
  file_name: string;
  file_content_type: string;
  file_size_bytes: number;
  created_at: string;
};

function mapSecurityTools(dto: IspdnSecurityToolsDto): IspdnSecurityTools {
  return {
    dlp: dto.dlp,
    siem: dto.siem,
    antivirus: dto.antivirus,
    ipsIds: dto.ips_ids,
    firewallUtmNgfw: dto.firewall_utm_ngfw,
    vulnerabilityScanner: dto.vulnerability_scanner,
    backupSystem: dto.backup_system,
    trustedBoot: dto.trusted_boot,
    accessControl: dto.access_control,
    physicalSecurity: dto.physical_security,
    otherSecurityTools: dto.other_security_tools,
  };
}

function mapSecurityToolsPayload(values: IspdnSecurityTools): IspdnSecurityToolsDto {
  return {
    dlp: values.dlp,
    siem: values.siem,
    antivirus: values.antivirus,
    ips_ids: values.ipsIds,
    firewall_utm_ngfw: values.firewallUtmNgfw,
    vulnerability_scanner: values.vulnerabilityScanner,
    backup_system: values.backupSystem,
    trusted_boot: values.trustedBoot,
    access_control: values.accessControl,
    physical_security: values.physicalSecurity,
    other_security_tools: values.otherSecurityTools?.trim() || null,
  };
}

function mapMeasure(dto: TechnicalSecurityMeasureDto): TechnicalSecurityMeasure {
  return {
    code: dto.code,
    sectionCode: dto.section_code,
    sectionTitle: dto.section_title,
    content: dto.content,
    securityLevel: dto.security_level,
    regulatoryStatus: dto.regulatory_status,
    regulatoryStatusLabel: dto.regulatory_status_label,
    factualStatus: dto.factual_status,
    factualStatusLabel: dto.factual_status_label,
    commentRequired: dto.comment_required,
    comment: dto.comment,
    hasComment: dto.has_comment,
    updatedAt: dto.updated_at,
  };
}

function mapDocument(dto: TechnicalSecurityMeasureDocumentDto): TechnicalSecurityMeasureDocument {
  return {
    id: dto.id,
    ispdnId: dto.ispdn_id,
    fileName: dto.file_name,
    fileContentType: dto.file_content_type,
    fileSizeBytes: dto.file_size_bytes,
    createdAt: dto.created_at,
  };
}

function mapTable(dto: TechnicalSecurityMeasuresTableDto): TechnicalSecurityMeasuresTable {
  return {
    ispdnId: dto.ispdn_id,
    recommendedLevel: dto.recommended_level,
    actualLevel: dto.actual_level,
    actualLevelMatchesRecommended: dto.actual_level_matches_recommended,
    items: dto.items.map(mapMeasure),
    summary: {
      totalCount: dto.summary.total_count,
      baseSetCount: dto.summary.base_set_count,
      notBaseSetCount: dto.summary.not_base_set_count,
      implementedCount: dto.summary.implemented_count,
      notImplementedCount: dto.summary.not_implemented_count,
      baseSetImplementedCount: dto.summary.base_set_implemented_count,
      baseSetNotImplementedCount: dto.summary.base_set_not_implemented_count,
      baseSetRejectedCount: dto.summary.base_set_rejected_count,
      commentRequiredCount: dto.summary.comment_required_count,
      commentNotRequiredCount: dto.summary.comment_not_required_count,
      missingRequiredCommentCount: dto.summary.missing_required_comment_count,
    },
  };
}

export function getIspdnSecurityTools(ispdnId: number) {
  return httpClient<IspdnSecurityToolsDto>(`/api/v1/ispdns/${ispdnId}/security-tools`).then(mapSecurityTools);
}

export function saveIspdnSecurityTools(ispdnId: number, payload: IspdnSecurityTools) {
  return httpClient<IspdnSecurityToolsDto>(`/api/v1/ispdns/${ispdnId}/security-tools`, {
    method: "PUT",
    body: JSON.stringify(mapSecurityToolsPayload(payload)),
  }).then(mapSecurityTools);
}

export function getTechnicalSecurityMeasures(ispdnId: number) {
  return httpClient<TechnicalSecurityMeasuresTableDto>(`/api/v1/ispdns/${ispdnId}/security-measures`).then(mapTable);
}

export function updateTechnicalSecurityMeasure(
  ispdnId: number,
  measureCode: string,
  payload: TechnicalSecurityMeasureUpdatePayload,
) {
  return httpClient<TechnicalSecurityMeasureDto>(
    `/api/v1/ispdns/${ispdnId}/security-measures/${encodeURIComponent(measureCode)}`,
    {
      method: "PUT",
      body: JSON.stringify({
        factual_status: payload.factualStatus,
        comment: payload.comment.trim() || null,
      }),
    },
  ).then(mapMeasure);
}

export function getTechnicalSecurityMeasureDocuments(ispdnId: number) {
  return httpClient<TechnicalSecurityMeasureDocumentDto[]>(
    `/api/v1/ispdns/${ispdnId}/security-measures/documents`,
  ).then((documents) => documents.map(mapDocument));
}

export function uploadTechnicalSecurityMeasureDocument(ispdnId: number, file: File) {
  const formData = new FormData();
  formData.append("document_file", file);

  return httpClient<TechnicalSecurityMeasureDocumentDto>(`/api/v1/ispdns/${ispdnId}/security-measures/documents`, {
    method: "POST",
    body: formData,
  }).then(mapDocument);
}

export async function downloadTechnicalSecurityMeasureDocument(ispdnId: number, documentId: number) {
  const response = await fetch(buildApiUrl(`/api/v1/ispdns/${ispdnId}/security-measures/documents/${documentId}/file`), {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.blob();
}

export function deleteTechnicalSecurityMeasureDocument(ispdnId: number, documentId: number) {
  return httpClient<void>(`/api/v1/ispdns/${ispdnId}/security-measures/documents/${documentId}`, {
    method: "DELETE",
  });
}
