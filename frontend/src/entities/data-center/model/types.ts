export type DataCenterOwnerType =
  | "individual"
  | "foreign_organization"
  | "individual_entrepreneur"
  | "legal_entity";

export type DataCenter = {
  id: number;
  name: string;
  locationCountry: string;
  locationAddress: string;
  isOwnDataCenter: boolean;
  ownerOrganizationType: DataCenterOwnerType | null;
  ownerPersonFullName: string | null;
  ownerOrganizationName: string | null;
  ownerOgrnip: string | null;
  ownerOgrn: string | null;
  ownerInn: string | null;
  ownerLocationCountry: string | null;
  ownerLocationAddress: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DataCenterListItem = {
  id: number;
  name: string;
  locationCountry: string;
  locationAddress: string;
  isOwnDataCenter: boolean;
  ownerOrganizationType: DataCenterOwnerType | null;
  ownerDisplayName: string;
  createdAt: string;
  updatedAt: string;
};

export type DataCenterOption = {
  id: number;
  name: string;
  locationCountry: string;
  locationAddress: string;
  isOwnDataCenter: boolean;
  ownerDisplayName: string;
};

export type DataCenterFormValues = {
  name: string;
  locationCountry: string;
  locationAddress: string;
  isOwnDataCenter: boolean;
  ownerOrganizationType: DataCenterOwnerType | "";
  ownerPersonFullName: string;
  ownerOrganizationName: string;
  ownerOgrnip: string;
  ownerOgrn: string;
  ownerInn: string;
  ownerLocationCountry: string;
  ownerLocationAddress: string;
};

export type IspdnDataCentersUpdate = {
  dataCenterIds: number[];
};
