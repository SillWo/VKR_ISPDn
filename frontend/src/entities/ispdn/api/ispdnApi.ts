import type {
  IspdnCard,
  IspdnFormValues,
  IspdnListItem,
  IspdnResponsibleEmployee,
  IspdnStatus,
} from "../model/types";
import { httpClient } from "../../../shared/api/httpClient";

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
  processing_purposes: string;
  commissioning_date: string;
  decommissioning_date: string | null;
  website_url: string | null;
  responsible_person: string;
  responsible_employee_id: number | null;
  responsible_employee: ResponsibleEmployeeDto | null;
  system_composition: string;
  status: IspdnStatus;
  created_at: string;
  updated_at: string;
};

type IspdnListItemDto = {
  id: number;
  name: string;
  short_description: string;
  processing_purposes: string;
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
  processing_purposes: string;
  commissioning_date: string;
  decommissioning_date: string | null;
  website_url: string | null;
  responsible_employee_id: number;
  system_composition: string;
  status: IspdnStatus;
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

function mapCard(dto: IspdnCardDto): IspdnCard {
  return {
    id: dto.id,
    name: dto.name,
    shortDescription: dto.short_description,
    processingPurposes: dto.processing_purposes,
    commissioningDate: dto.commissioning_date,
    decommissioningDate: dto.decommissioning_date,
    websiteUrl: dto.website_url,
    responsiblePerson: dto.responsible_person,
    responsibleEmployeeId: dto.responsible_employee_id,
    responsibleEmployee: mapResponsibleEmployee(dto.responsible_employee),
    systemComposition: dto.system_composition,
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
    processingPurposes: dto.processing_purposes,
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
    processing_purposes: values.processingPurposes.trim(),
    commissioning_date: values.commissioningDate,
    decommissioning_date: values.decommissioningDate || null,
    website_url: values.websiteUrl.trim() || null,
    responsible_employee_id: values.responsibleEmployeeId ?? 0,
    system_composition: values.systemComposition.trim(),
    status: values.status,
  };
}

export function getIspdns() {
  return httpClient<IspdnListItemDto[]>("/api/v1/ispdns").then((items) => items.map(mapListItem));
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
