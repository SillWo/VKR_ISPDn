import type { InternalNetworkTransfer, InternetTransfer, ProcessingType } from "./catalogs";

export type SwitchValues = Record<string, boolean>;
export type PersonalDataActionValues = Record<string, boolean | string>;
export type DataCategoryValues = Record<string, boolean | string>;

export type LinkedIspdnShort = {
  id: number;
  name: string;
  status: string;
};

export type ProcessingProcessFormValues = {
  name: string;
  purposeName: string;
  processingPeriod: string;
  subjectCategories: SwitchValues;
  dataCategories: DataCategoryValues;
  legalBases: SwitchValues;
  personalDataActions: PersonalDataActionValues;
  processingType: ProcessingType | "";
  internalNetworkTransfer: InternalNetworkTransfer | "";
  internetTransfer: InternetTransfer | "";
  crossBorderTransfer: boolean;
};

export type ProcessingProcess = {
  id: number;
  name: string;
  purposeName: string;
  processingPeriod: string;
  subjectCategories: SwitchValues;
  dataCategories: DataCategoryValues;
  legalBases: SwitchValues;
  personalDataActions: PersonalDataActionValues;
  processingType: ProcessingType;
  internalNetworkTransfer: InternalNetworkTransfer;
  internetTransfer: InternetTransfer;
  crossBorderTransfer: boolean;
  processSignature: string;
  linkedIspdns: LinkedIspdnShort[];
  linkedIspdnsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ProcessingProcessListItem = ProcessingProcess;

export type ProcessingProcessOption = {
  id: number;
  name: string;
  purposeName: string;
  processingPeriod: string;
};

export type ProcessingProcessRegistryItem = {
  id: number;
  name: string;
  purposeName: string;
  processingPeriod: string;
  linkedIspdnsCount: number;
  linkedIspdns: LinkedIspdnShort[];
  createdAt: string;
  updatedAt: string;
};

export type IspdnProcessingProcessLinkCreate = {
  processingProcessId: number;
};

export type ProcessingProcessDocumentContext = {
  ispdnId: number;
  processes: Array<{
    id: number;
    name: string;
    purposeName: string;
    processingPeriod: string;
    subjectCategories: string[];
    dataCategories: string[];
    legalBases: string[];
    personalDataActions: string[];
    processingMethods: {
      processingType: string;
      internalNetworkTransfer: string;
      internetTransfer: string;
      crossBorderTransfer: boolean;
    };
  }>;
  processingPurposePeriods: Array<{
    purposeName: string;
    processingPeriod: string;
  }>;
};
