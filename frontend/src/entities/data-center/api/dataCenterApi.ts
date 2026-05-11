import { httpClient } from "../../../shared/api/httpClient";
import type {
  DataCenter,
  DataCenterFormValues,
  DataCenterListItem,
  DataCenterOption,
  DataCenterOwnerType,
} from "../model/types";

type DataCenterDto = {
  id: number;
  name: string;
  location_country: string;
  location_address: string;
  is_own_data_center: boolean;
  owner_organization_type: DataCenterOwnerType | null;
  owner_person_full_name: string | null;
  owner_organization_name: string | null;
  owner_ogrnip: string | null;
  owner_ogrn: string | null;
  owner_inn: string | null;
  owner_location_country: string | null;
  owner_location_address: string | null;
  created_at: string;
  updated_at: string;
};

type DataCenterListItemDto = {
  id: number;
  name: string;
  location_country: string;
  location_address: string;
  is_own_data_center: boolean;
  owner_organization_type: DataCenterOwnerType | null;
  owner_display_name: string;
  created_at: string;
  updated_at: string;
};

type DataCenterOptionDto = {
  id: number;
  name: string;
  location_country: string;
  location_address: string;
  is_own_data_center: boolean;
  owner_display_name: string;
};

type DataCenterPayloadDto = {
  name: string;
  location_country: string;
  location_address: string;
  is_own_data_center: boolean;
  owner_organization_type: DataCenterOwnerType | null;
  owner_person_full_name: string | null;
  owner_organization_name: string | null;
  owner_ogrnip: string | null;
  owner_ogrn: string | null;
  owner_inn: string | null;
  owner_location_country: string | null;
  owner_location_address: string | null;
};

function mapDataCenter(dto: DataCenterDto): DataCenter {
  return {
    id: dto.id,
    name: dto.name,
    locationCountry: dto.location_country,
    locationAddress: dto.location_address,
    isOwnDataCenter: dto.is_own_data_center,
    ownerOrganizationType: dto.owner_organization_type,
    ownerPersonFullName: dto.owner_person_full_name,
    ownerOrganizationName: dto.owner_organization_name,
    ownerOgrnip: dto.owner_ogrnip,
    ownerOgrn: dto.owner_ogrn,
    ownerInn: dto.owner_inn,
    ownerLocationCountry: dto.owner_location_country,
    ownerLocationAddress: dto.owner_location_address,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

function mapListItem(dto: DataCenterListItemDto): DataCenterListItem {
  return {
    id: dto.id,
    name: dto.name,
    locationCountry: dto.location_country,
    locationAddress: dto.location_address,
    isOwnDataCenter: dto.is_own_data_center,
    ownerOrganizationType: dto.owner_organization_type,
    ownerDisplayName: dto.owner_display_name,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

function mapOption(dto: DataCenterOptionDto): DataCenterOption {
  return {
    id: dto.id,
    name: dto.name,
    locationCountry: dto.location_country,
    locationAddress: dto.location_address,
    isOwnDataCenter: dto.is_own_data_center,
    ownerDisplayName: dto.owner_display_name,
  };
}

function optionalText(value: string) {
  return value.trim() || null;
}

function mapPayload(values: DataCenterFormValues): DataCenterPayloadDto {
  if (values.isOwnDataCenter) {
    return {
      name: values.name.trim(),
      location_country: values.locationCountry.trim(),
      location_address: values.locationAddress.trim(),
      is_own_data_center: true,
      owner_organization_type: null,
      owner_person_full_name: null,
      owner_organization_name: null,
      owner_ogrnip: null,
      owner_ogrn: null,
      owner_inn: null,
      owner_location_country: null,
      owner_location_address: null,
    };
  }

  const ownerOrganizationType = values.ownerOrganizationType || null;

  return {
    name: values.name.trim(),
    location_country: values.locationCountry.trim(),
    location_address: values.locationAddress.trim(),
    is_own_data_center: false,
    owner_organization_type: ownerOrganizationType,
    owner_person_full_name:
      ownerOrganizationType === "individual" || ownerOrganizationType === "individual_entrepreneur"
        ? optionalText(values.ownerPersonFullName)
        : null,
    owner_organization_name:
      ownerOrganizationType === "legal_entity" || ownerOrganizationType === "foreign_organization"
        ? optionalText(values.ownerOrganizationName)
        : null,
    owner_ogrnip: ownerOrganizationType === "individual_entrepreneur" ? optionalText(values.ownerOgrnip) : null,
    owner_ogrn: ownerOrganizationType === "legal_entity" ? optionalText(values.ownerOgrn) : null,
    owner_inn:
      ownerOrganizationType === "individual" ||
      ownerOrganizationType === "individual_entrepreneur" ||
      ownerOrganizationType === "legal_entity"
        ? optionalText(values.ownerInn)
        : null,
    owner_location_country: optionalText(values.ownerLocationCountry),
    owner_location_address: optionalText(values.ownerLocationAddress),
  };
}

export function toDataCenterFormValues(dataCenter: DataCenter): DataCenterFormValues {
  return {
    name: dataCenter.name,
    locationCountry: dataCenter.locationCountry,
    locationAddress: dataCenter.locationAddress,
    isOwnDataCenter: dataCenter.isOwnDataCenter,
    ownerOrganizationType: dataCenter.ownerOrganizationType ?? "",
    ownerPersonFullName: dataCenter.ownerPersonFullName ?? "",
    ownerOrganizationName: dataCenter.ownerOrganizationName ?? "",
    ownerOgrnip: dataCenter.ownerOgrnip ?? "",
    ownerOgrn: dataCenter.ownerOgrn ?? "",
    ownerInn: dataCenter.ownerInn ?? "",
    ownerLocationCountry: dataCenter.ownerLocationCountry ?? "",
    ownerLocationAddress: dataCenter.ownerLocationAddress ?? "",
  };
}

export function getDataCenters() {
  return httpClient<DataCenterListItemDto[]>("/api/v1/data-centers").then((items) => items.map(mapListItem));
}

export function getDataCenterOptions() {
  return httpClient<DataCenterOptionDto[]>("/api/v1/data-centers/options").then((items) => items.map(mapOption));
}

export function getDataCenterById(dataCenterId: number) {
  return httpClient<DataCenterDto>(`/api/v1/data-centers/${dataCenterId}`).then(mapDataCenter);
}

export function createDataCenter(payload: DataCenterFormValues) {
  return httpClient<DataCenterDto>("/api/v1/data-centers", {
    method: "POST",
    body: JSON.stringify(mapPayload(payload)),
  }).then(mapDataCenter);
}

export function updateDataCenter(dataCenterId: number, payload: DataCenterFormValues) {
  return httpClient<DataCenterDto>(`/api/v1/data-centers/${dataCenterId}`, {
    method: "PUT",
    body: JSON.stringify(mapPayload(payload)),
  }).then(mapDataCenter);
}

export function deleteDataCenter(dataCenterId: number) {
  return httpClient<void>(`/api/v1/data-centers/${dataCenterId}`, { method: "DELETE" });
}

export function getIspdnDataCenters(ispdnId: number) {
  return httpClient<DataCenterOptionDto[]>(`/api/v1/ispdns/${ispdnId}/data-centers`).then((items) =>
    items.map(mapOption),
  );
}

export function updateIspdnDataCenters(ispdnId: number, dataCenterIds: number[]) {
  return httpClient<DataCenterOptionDto[]>(`/api/v1/ispdns/${ispdnId}/data-centers`, {
    method: "PUT",
    body: JSON.stringify({ data_center_ids: dataCenterIds }),
  }).then((items) => items.map(mapOption));
}
