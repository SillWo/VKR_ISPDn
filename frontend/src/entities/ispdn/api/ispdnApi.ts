import { httpClient } from "../../../shared/api/httpClient";
import type { DataCenterOption } from "../../data-center/model/types";
import type {
  IspdnCard,
  IspdnFormValues,
  IspdnListItem,
  IspdnResponsibleEmployee,
  IspdnSecurityTools,
  IspdnStatus,
} from "../model/types";

type ResponsibleEmployeeDto = {
  id: number;
  full_name: string;
  position: string;
  document_initials: string;
  department_id: number | null;
  department_name: string | null;
};

type IspdnCardDto = {
  id: number;
  name: string;
  short_description: string;
  data_centers: DataCenterOptionDto[];
  commissioning_date: string;
  decommissioning_date: string | null;
  website_url: string | null;
  responsible_person: string;
  responsible_employee_id: number | null;
  responsible_employee: ResponsibleEmployeeDto | null;
  system_composition: string;
  security_tools: IspdnSecurityToolsDto;
  status: IspdnStatus;
  created_at: string;
  updated_at: string;
};

type IspdnListItemDto = {
  id: number;
  name: string;
  short_description: string;
  status: IspdnStatus;
  responsible_person: string;
  responsible_employee_id: number | null;
  responsible_employee: ResponsibleEmployeeDto | null;
  commissioning_date: string;
  decommissioning_date: string | null;
  updated_at: string;
};

type IspdnPayloadDto = {
  name: string;
  short_description: string;
  commissioning_date: string;
  decommissioning_date: string | null;
  website_url: string | null;
  responsible_employee_id: number;
  system_composition: string;
  security_tools: IspdnSecurityToolsDto;
  status: IspdnStatus;
};

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

type DataCenterOptionDto = {
  id: number;
  name: string;
  location_country: string;
  location_address: string;
  is_own_data_center: boolean;
  owner_display_name: string;
};

type GetIspdnsParams = {
  status?: IspdnStatus;
};

function mapResponsibleEmployee(dto: ResponsibleEmployeeDto | null): IspdnResponsibleEmployee | null {
  if (!dto) {
    return null;
  }
  return {
    id: dto.id,
    fullName: dto.full_name,
    position: dto.position,
    documentInitials: dto.document_initials,
    departmentId: dto.department_id,
    departmentName: dto.department_name,
  };
}

function mapDataCenterOption(dto: DataCenterOptionDto): DataCenterOption {
  return {
    id: dto.id,
    name: dto.name,
    locationCountry: dto.location_country,
    locationAddress: dto.location_address,
    isOwnDataCenter: dto.is_own_data_center,
    ownerDisplayName: dto.owner_display_name,
  };
}

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

function mapCard(dto: IspdnCardDto): IspdnCard {
  return {
    id: dto.id,
    name: dto.name,
    shortDescription: dto.short_description,
    dataCenters: dto.data_centers.map(mapDataCenterOption),
    commissioningDate: dto.commissioning_date,
    decommissioningDate: dto.decommissioning_date,
    websiteUrl: dto.website_url,
    responsiblePerson: dto.responsible_person,
    responsibleEmployeeId: dto.responsible_employee_id,
    responsibleEmployee: mapResponsibleEmployee(dto.responsible_employee),
    systemComposition: dto.system_composition,
    securityTools: mapSecurityTools(dto.security_tools),
    status: dto.status,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

function mapListItem(dto: IspdnListItemDto): IspdnListItem {
  return {
    id: dto.id,
    name: dto.name,
    shortDescription: dto.short_description,
    status: dto.status,
    responsiblePerson: dto.responsible_person,
    responsibleEmployeeId: dto.responsible_employee_id,
    responsibleEmployee: mapResponsibleEmployee(dto.responsible_employee),
    commissioningDate: dto.commissioning_date,
    decommissioningDate: dto.decommissioning_date,
    updatedAt: dto.updated_at,
  };
}

function mapPayload(values: IspdnFormValues): IspdnPayloadDto {
  return {
    name: values.name.trim(),
    short_description: values.shortDescription.trim(),
    commissioning_date: values.commissioningDate,
    decommissioning_date: values.decommissioningDate || null,
    website_url: values.websiteUrl.trim() || null,
    responsible_employee_id: values.responsibleEmployeeId ?? 0,
    system_composition: values.systemComposition.trim(),
    security_tools: mapSecurityToolsPayload(values.securityTools),
    status: values.status,
  };
}

export function getIspdns(params?: GetIspdnsParams) {
  const searchParams = new URLSearchParams();
  if (params?.status) {
    searchParams.set("status", params.status);
  }
  const query = searchParams.toString();
  const path = query ? `/api/v1/ispdns?${query}` : "/api/v1/ispdns";

  return httpClient<IspdnListItemDto[]>(path).then((items) => items.map(mapListItem));
}

export function getIspdnById(id: number) {
  return httpClient<IspdnCardDto>(`/api/v1/ispdns/${id}`).then(mapCard);
}

export function createIspdn(payload: IspdnFormValues) {
  return httpClient<IspdnCardDto>("/api/v1/ispdns", {
    method: "POST",
    body: JSON.stringify(mapPayload(payload)),
  }).then(mapCard);
}

export function updateIspdn(id: number, payload: IspdnFormValues) {
  return httpClient<IspdnCardDto>(`/api/v1/ispdns/${id}`, {
    method: "PUT",
    body: JSON.stringify(mapPayload(payload)),
  }).then(mapCard);
}

export function deleteIspdn(id: number) {
  return httpClient<void>(`/api/v1/ispdns/${id}`, {
    method: "DELETE",
  });
}
