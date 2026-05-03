export type IspdnStatus = "active" | "archived";

export type IspdnCard = {
  id: number;
  name: string;
  shortDescription: string;
  processingPurposes: string;
  commissioningDate: string;
  decommissioningDate: string | null;
  websiteUrl: string | null;
  responsiblePerson: string;
  systemComposition: string;
  status: IspdnStatus;
  createdAt: string;
  updatedAt: string;
};

export type IspdnListItem = {
  id: number;
  name: string;
  shortDescription: string;
  processingPurposes: string;
  status: IspdnStatus;
  responsiblePerson: string;
  commissioningDate: string;
  decommissioningDate: string | null;
  updatedAt: string;
};

export type IspdnFormValues = {
  name: string;
  shortDescription: string;
  processingPurposes: string;
  commissioningDate: string;
  decommissioningDate: string;
  websiteUrl: string;
  responsiblePerson: string;
  systemComposition: string;
  status: IspdnStatus;
};
