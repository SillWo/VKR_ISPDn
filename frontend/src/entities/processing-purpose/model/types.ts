export type ProcessingPurpose = {
  id: number;
  name: string;
  processingPeriod: string;
  createdAt: string;
  updatedAt: string;
};

export type ProcessingPurposeOption = {
  id: number;
  name: string;
  processingPeriod: string;
};

export type ProcessingPurposeFormValues = {
  name: string;
  processingPeriod: string;
};
