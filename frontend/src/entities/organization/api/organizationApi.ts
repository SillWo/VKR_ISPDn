import { httpClient } from "../../../shared/api/httpClient";
import type {
  OrganizationCard,
  OrganizationEmployeeRef,
  OrganizationFormValues,
  OrganizationOperatorType,
  OrganizationTerminationType,
} from "../model/types";

type OrganizationEmployeeDto = {
  id: number;
  full_name: string;
  position: string;
  document_initials: string;
  phone_number?: string | null;
  email?: string | null;
  department_id: number | null;
  department_name: string | null;
};

type OrganizationOkvedDto = {
  id: number;
  code: string;
  name: string;
  sort_order: number;
};

type OrganizationBranchDto = {
  id: number;
  name: string;
  postal_address: string;
  sort_order: number;
};

type OrganizationCardDto = {
  id: number;
  short_legal_name: string;
  full_legal_name: string;
  inn: string;
  ogrn: string;
  kpp: string;
  head_employee_id: number | null;
  head_employee: OrganizationEmployeeDto | null;
  registration_address: string;
  registration_city: string;
  operator_type: OrganizationOperatorType | null;
  head_office_region: string | null;
  activity_regions: string | null;
  postal_address_matches_registration: boolean;
  postal_address: string | null;
  phone: string | null;
  fax: string | null;
  email: string | null;
  okpo: string | null;
  okfs: string | null;
  okogu: string | null;
  okopf: string | null;
  document_approver_employee_id: number | null;
  document_approver_employee: OrganizationEmployeeDto | null;
  information_security_responsible_employee_id: number | null;
  information_security_responsible_employee: OrganizationEmployeeDto | null;
  personal_data_processing_responsible_employee_id: number | null;
  personal_data_processing_responsible_employee: OrganizationEmployeeDto | null;
  personal_data_processing_termination_type: OrganizationTerminationType | null;
  personal_data_processing_termination_date: string | null;
  personal_data_processing_termination_condition: string | null;
  okveds: OrganizationOkvedDto[];
  branches: OrganizationBranchDto[];
  created_at: string;
  updated_at: string;
};

type OrganizationPayloadDto = {
  short_legal_name: string;
  full_legal_name: string;
  inn: string;
  ogrn: string;
  kpp: string;
  head_employee_id: number | null;
  registration_address: string;
  registration_city: string;
  operator_type: OrganizationOperatorType | null;
  head_office_region: string | null;
  activity_regions: string | null;
  postal_address_matches_registration: boolean;
  postal_address: string | null;
  phone: string | null;
  fax: string | null;
  email: string | null;
  okpo: string | null;
  okfs: string | null;
  okogu: string | null;
  okopf: string | null;
  document_approver_employee_id: number | null;
  information_security_responsible_employee_id: number | null;
  personal_data_processing_responsible_employee_id: number | null;
  personal_data_processing_termination_type: OrganizationTerminationType;
  personal_data_processing_termination_date: string | null;
  personal_data_processing_termination_condition: string | null;
  okveds: Array<{ code: string; name: string }>;
  branches: Array<{ name: string; postal_address: string }>;
};

function mapOptionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed || null;
}

function mapEmployee(dto: OrganizationEmployeeDto | null): OrganizationEmployeeRef | null {
  if (!dto) {
    return null;
  }
  return {
    id: dto.id,
    fullName: dto.full_name,
    position: dto.position,
    documentInitials: dto.document_initials,
    phoneNumber: dto.phone_number ?? null,
    email: dto.email ?? null,
    departmentId: dto.department_id,
    departmentName: dto.department_name,
  };
}

function mapCard(dto: OrganizationCardDto): OrganizationCard {
  return {
    id: dto.id,
    shortLegalName: dto.short_legal_name,
    fullLegalName: dto.full_legal_name,
    inn: dto.inn,
    ogrn: dto.ogrn,
    kpp: dto.kpp,
    headEmployeeId: dto.head_employee_id,
    headEmployee: mapEmployee(dto.head_employee),
    registrationAddress: dto.registration_address,
    registrationCity: dto.registration_city,
    operatorType: dto.operator_type ?? "",
    headOfficeRegion: dto.head_office_region ?? "",
    activityRegions: dto.activity_regions ?? "",
    postalAddressMatchesRegistration: dto.postal_address_matches_registration,
    postalAddress: dto.postal_address ?? "",
    phone: dto.phone ?? "",
    fax: dto.fax ?? "",
    email: dto.email ?? "",
    okpo: dto.okpo ?? "",
    okfs: dto.okfs ?? "",
    okogu: dto.okogu ?? "",
    okopf: dto.okopf ?? "",
    documentApproverEmployeeId: dto.document_approver_employee_id,
    documentApproverEmployee: mapEmployee(dto.document_approver_employee),
    informationSecurityResponsibleEmployeeId: dto.information_security_responsible_employee_id,
    informationSecurityResponsibleEmployee: mapEmployee(dto.information_security_responsible_employee),
    personalDataProcessingResponsibleEmployeeId: dto.personal_data_processing_responsible_employee_id,
    personalDataProcessingResponsibleEmployee: mapEmployee(dto.personal_data_processing_responsible_employee),
    personalDataProcessingTerminationType: dto.personal_data_processing_termination_type ?? "",
    personalDataProcessingTerminationDate: dto.personal_data_processing_termination_date ?? "",
    personalDataProcessingTerminationCondition: dto.personal_data_processing_termination_condition ?? "",
    okveds: dto.okveds.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name,
      sortOrder: item.sort_order,
    })),
    branches: dto.branches.map((item) => ({
      id: item.id,
      name: item.name,
      postalAddress: item.postal_address,
      sortOrder: item.sort_order,
    })),
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

function mapPayload(values: OrganizationFormValues): OrganizationPayloadDto {
  return {
    short_legal_name: values.shortLegalName.trim(),
    full_legal_name: values.fullLegalName.trim(),
    inn: values.inn.trim(),
    ogrn: values.ogrn.trim(),
    kpp: values.kpp.trim(),
    head_employee_id: values.headEmployeeId,
    registration_address: values.registrationAddress.trim(),
    registration_city: values.registrationCity.trim(),
    operator_type: values.operatorType || null,
    head_office_region: mapOptionalText(values.headOfficeRegion),
    activity_regions: mapOptionalText(values.activityRegions),
    postal_address_matches_registration: values.postalAddressMatchesRegistration,
    postal_address: values.postalAddressMatchesRegistration ? null : mapOptionalText(values.postalAddress),
    phone: mapOptionalText(values.phone),
    fax: mapOptionalText(values.fax),
    email: mapOptionalText(values.email),
    okpo: mapOptionalText(values.okpo),
    okfs: mapOptionalText(values.okfs),
    okogu: mapOptionalText(values.okogu),
    okopf: mapOptionalText(values.okopf),
    document_approver_employee_id: values.documentApproverEmployeeId,
    information_security_responsible_employee_id: values.informationSecurityResponsibleEmployeeId,
    personal_data_processing_responsible_employee_id: values.personalDataProcessingResponsibleEmployeeId,
    personal_data_processing_termination_type: values.personalDataProcessingTerminationType as OrganizationTerminationType,
    personal_data_processing_termination_date:
      values.personalDataProcessingTerminationType === "end_date"
        ? values.personalDataProcessingTerminationDate
        : null,
    personal_data_processing_termination_condition:
      values.personalDataProcessingTerminationType === "end_condition"
        ? mapOptionalText(values.personalDataProcessingTerminationCondition)
        : null,
    okveds: values.okveds.map((item) => ({
      code: item.code.trim(),
      name: item.name.trim(),
    })),
    branches: values.branches.map((item) => ({
      name: item.name.trim(),
      postal_address: item.postalAddress.trim(),
    })),
  };
}

export function getOrganization() {
  return httpClient<OrganizationCardDto>("/api/v1/organization").then(mapCard);
}

export function saveOrganization(payload: OrganizationFormValues) {
  return httpClient<OrganizationCardDto>("/api/v1/organization", {
    method: "PUT",
    body: JSON.stringify(mapPayload(payload)),
  }).then(mapCard);
}
