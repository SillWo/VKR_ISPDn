import type { ProcessingPurposeOption } from "../../processing-purpose/model/types";

export type IspdnStatus = "active" | "archived";

export type IspdnResponsibleEmployee = {
  id: number;
  fullName: string;
  position: string;
  documentInitials: string;
  departmentId: number | null;
  departmentName: string | null;
};

export type IspdnCard = {
  id: number;
  name: string;
  shortDescription: string;
  processingPurposes: string;
  processingPurposeIds: number[];
  processingPurposeOptions: ProcessingPurposeOption[];
  commissioningDate: string;
  decommissioningDate: string | null;
  websiteUrl: string | null;
  responsiblePerson: string;
  responsibleEmployeeId: number | null;
  responsibleEmployee: IspdnResponsibleEmployee | null;
  systemComposition: string;
  securityTools: IspdnSecurityTools;
  status: IspdnStatus;
  createdAt: string;
  updatedAt: string;
};

export type IspdnListItem = {
  id: number;
  name: string;
  shortDescription: string;
  processingPurposes: string;
  processingPurposeIds: number[];
  processingPurposeOptions: ProcessingPurposeOption[];
  status: IspdnStatus;
  responsiblePerson: string;
  responsibleEmployeeId: number | null;
  responsibleEmployee: IspdnResponsibleEmployee | null;
  commissioningDate: string;
  decommissioningDate: string | null;
  updatedAt: string;
};

export type IspdnFormValues = {
  name: string;
  shortDescription: string;
  processingPurposes: string;
  processingPurposeIds: number[];
  commissioningDate: string;
  decommissioningDate: string;
  websiteUrl: string;
  responsibleEmployeeId: number | null;
  systemComposition: string;
  securityTools: IspdnSecurityTools;
  status: IspdnStatus;
};

export type IspdnSecurityTools = {
  dlp: boolean;
  siem: boolean;
  antivirus: boolean;
  ipsIds: boolean;
  firewallUtmNgfw: boolean;
  vulnerabilityScanner: boolean;
  backupSystem: boolean;
  trustedBoot: boolean;
  accessControl: boolean;
  physicalSecurity: boolean;
  otherSecurityTools: string | null;
};
