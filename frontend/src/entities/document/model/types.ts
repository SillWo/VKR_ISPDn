export type DocumentManualFieldType = "text" | "textarea" | "array";

export type DocumentManualField = {
  name: string;
  label: string;
  type: DocumentManualFieldType;
  required: boolean;
  items?: DocumentManualField[];
};

export type DocumentType = {
  code: string;
  title: string;
  description: string;
  requiresIspdn: boolean;
  manualFields: DocumentManualField[];
};

export type ActIspdnCommissioningEvent = {
  eventName: string;
  responsibleEmployeeId: number | null;
};

export type ActIspdnCommissioningFormValues = {
  descriptionOfViolationsAndDisadvantages: string;
  recommendation: string;
  events: ActIspdnCommissioningEvent[];
};

export type GenerateIspdnDocumentPayload = {
  documentType: string;
  manualData: {
    description_of_violations_and_disadvantages: string;
    recommendation: string;
    events: Array<{
      event_name: string;
      responsible_employee_id: number;
    }>;
  };
};

export type GeneratedDocumentFile = {
  blob: Blob;
  filename: string;
};
