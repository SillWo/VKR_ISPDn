import type { EmployeeOption } from "../../employee/model/types";

export type OrganizationOperatorType =
  | "legal_entity"
  | "individual_entrepreneur"
  | "state_body"
  | "municipal_body"
  | "branch"
  | "foreign_citizen";

export type OrganizationTerminationType = "end_date" | "end_condition";
export type IdentityDocumentType = "passport_rf" | "other_rf_document";

export type OrganizationOkved = {
  id: number;
  code: string;
  name: string;
  sortOrder: number;
};

export type OrganizationOkvedFormValue = {
  code: string;
  name: string;
};

export type OrganizationBranch = {
  id: number;
  name: string;
  postalAddress: string;
  sortOrder: number;
};

export type OrganizationBranchFormValue = {
  name: string;
  postalAddress: string;
};

export type OrganizationEmployeeRef = EmployeeOption;

export type OrganizationReadiness = {
  isReadyForIspdnCreation: boolean;
  message: string | null;
};

export type OrganizationCard = {
  id: number;
  shortLegalName: string;
  fullLegalName: string;
  inn: string;
  ogrn: string;
  kpp: string;
  headEmployeeId: number | null;
  headEmployee: OrganizationEmployeeRef | null;
  registrationAddress: string;
  registrationCity: string;
  operatorType: OrganizationOperatorType | "";
  identityDocumentType: IdentityDocumentType | "";
  identityDocumentName: string;
  identityDocumentSeries: string;
  identityDocumentNumber: string;
  identityDocumentIssuedBy: string;
  identityDocumentIssuedDate: string;
  headOfficeRegion: string;
  activityRegions: string;
  rknOfficeAddress: string;
  postalAddressMatchesRegistration: boolean;
  postalAddress: string;
  phone: string;
  fax: string;
  email: string;
  okpo: string;
  okfs: string;
  okogu: string;
  okopf: string;
  documentApproverEmployeeId: number | null;
  documentApproverEmployee: OrganizationEmployeeRef | null;
  informationSecurityResponsibleEmployeeId: number | null;
  informationSecurityResponsibleEmployee: OrganizationEmployeeRef | null;
  personalDataProcessingResponsibleEmployeeId: number | null;
  personalDataProcessingResponsibleEmployee: OrganizationEmployeeRef | null;
  personalDataProcessingTerminationType: OrganizationTerminationType | "";
  personalDataProcessingTerminationDate: string;
  personalDataProcessingTerminationCondition: string;
  okveds: OrganizationOkved[];
  branches: OrganizationBranch[];
  createdAt: string;
  updatedAt: string;
};

export type OrganizationFormValues = {
  shortLegalName: string;
  fullLegalName: string;
  inn: string;
  ogrn: string;
  kpp: string;
  headEmployeeId: number | null;
  registrationAddress: string;
  registrationCity: string;
  operatorType: OrganizationOperatorType | "";
  identityDocumentType: IdentityDocumentType | "";
  identityDocumentName: string;
  identityDocumentSeries: string;
  identityDocumentNumber: string;
  identityDocumentIssuedBy: string;
  identityDocumentIssuedDate: string;
  headOfficeRegion: string;
  activityRegions: string;
  rknOfficeAddress: string;
  postalAddressMatchesRegistration: boolean;
  postalAddress: string;
  phone: string;
  fax: string;
  email: string;
  okpo: string;
  okfs: string;
  okogu: string;
  okopf: string;
  documentApproverEmployeeId: number | null;
  informationSecurityResponsibleEmployeeId: number | null;
  personalDataProcessingResponsibleEmployeeId: number | null;
  personalDataProcessingTerminationType: OrganizationTerminationType | "";
  personalDataProcessingTerminationDate: string;
  personalDataProcessingTerminationCondition: string;
  okveds: OrganizationOkvedFormValue[];
  branches: OrganizationBranchFormValue[];
};
