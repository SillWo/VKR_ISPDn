import type { IspdnSecurityTools } from "../../ispdn/model/types";
import type { SecurityLevelValue } from "../../security-level/model/types";

export type { IspdnSecurityTools };

export type TechnicalMeasureRegulatoryStatus = "base_set" | "not_base_set";
export type TechnicalMeasureFactualStatus = "implemented" | "not_implemented";

export type TechnicalSecurityMeasure = {
  code: string;
  sectionCode: string;
  sectionTitle: string;
  content: string;
  securityLevel: SecurityLevelValue;
  regulatoryStatus: TechnicalMeasureRegulatoryStatus;
  regulatoryStatusLabel: string;
  factualStatus: TechnicalMeasureFactualStatus;
  factualStatusLabel: string;
  commentRequired: boolean;
  comment: string | null;
  hasComment: boolean;
  updatedAt: string | null;
};

export type TechnicalSecurityMeasuresSummary = {
  totalCount: number;
  baseSetCount: number;
  notBaseSetCount: number;
  implementedCount: number;
  notImplementedCount: number;
  baseSetImplementedCount: number;
  baseSetNotImplementedCount: number;
  baseSetRejectedCount: number;
  commentRequiredCount: number;
  commentNotRequiredCount: number;
  missingRequiredCommentCount: number;
};

export type TechnicalSecurityMeasuresTable = {
  ispdnId: number;
  recommendedLevel: SecurityLevelValue;
  actualLevel: SecurityLevelValue;
  actualLevelMatchesRecommended: boolean;
  items: TechnicalSecurityMeasure[];
  summary: TechnicalSecurityMeasuresSummary;
};

export type TechnicalSecurityMeasureUpdatePayload = {
  factualStatus: TechnicalMeasureFactualStatus;
  comment: string;
};

export type TechnicalSecurityMeasureDocument = {
  id: number;
  ispdnId: number;
  fileName: string;
  fileContentType: string;
  fileSizeBytes: number;
  createdAt: string;
};
