import { httpClient } from "../../../shared/api/httpClient";
import type { OrganizationCard, OrganizationFormValues } from "../model/types";

type OrganizationCardDto = {
  id: number;
  short_legal_name: string;
  full_legal_name: string;
  inn: string;
  ogrn: string;
  kpp: string;
  head_full_name: string;
  head_position: string;
  registration_address: string;
  registration_city: string;
  created_at: string;
  updated_at: string;
};

type OrganizationPayloadDto = {
  short_legal_name: string;
  full_legal_name: string;
  inn: string;
  ogrn: string;
  kpp: string;
  head_full_name: string;
  head_position: string;
  registration_address: string;
  registration_city: string;
};

function mapCard(dto: OrganizationCardDto): OrganizationCard {
  return {
    id: dto.id,
    shortLegalName: dto.short_legal_name,
    fullLegalName: dto.full_legal_name,
    inn: dto.inn,
    ogrn: dto.ogrn,
    kpp: dto.kpp,
    headFullName: dto.head_full_name,
    headPosition: dto.head_position,
    registrationAddress: dto.registration_address,
    registrationCity: dto.registration_city,
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
    head_full_name: values.headFullName.trim(),
    head_position: values.headPosition.trim(),
    registration_address: values.registrationAddress.trim(),
    registration_city: values.registrationCity.trim(),
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
