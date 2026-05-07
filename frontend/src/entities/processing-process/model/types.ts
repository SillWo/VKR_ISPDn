import type { ProcessingPurposeOption } from "../../processing-purpose/model/types";
import type { InternalNetworkTransfer, InternetTransfer, ProcessingType } from "./catalogs";

export type SwitchValues = Record<string, boolean>;
export type PersonalDataActionValues = Record<string, boolean | string>;
export type DataCategoryValues = Record<string, boolean | string>;

export type ProcessingProcessFormValues = {
  processingPurposeId: number | null;
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
  ispdnId: number;
  processingPurposeId: number;
  processingPurpose: ProcessingPurposeOption;
  subjectCategories: SwitchValues;
  dataCategories: DataCategoryValues;
  legalBases: SwitchValues;
  personalDataActions: PersonalDataActionValues;
  processingType: ProcessingType;
  internalNetworkTransfer: InternalNetworkTransfer;
  internetTransfer: InternetTransfer;
  crossBorderTransfer: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProcessingProcessDocumentContext = {
  ispdnId: number;
  processes: Array<{
    id: number;
    purpose: ProcessingPurposeOption;
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
};
