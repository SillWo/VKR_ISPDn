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
  controlEventId: number | null;
  responsibleEmployeeId: number | null;
};

export type ActIspdnCommissioningFormValues = {
  descriptionOfViolationsAndDisadvantages: string;
  recommendation: string;
  events: ActIspdnCommissioningEvent[];
};

export type ActSafetyLevelCommissionMember = {
  employeeId: number | null;
};

export type ActSafetyLevelDocumentFormValues = {
  commissionMembers: ActSafetyLevelCommissionMember[];
};

export type ActIspdnCommissioningDocumentPayload = {
  documentType: string;
  manualData: {
    description_of_violations_and_disadvantages: string;
    recommendation: string;
    events: Array<{
      control_event_id: number;
      responsible_employee_id: number;
    }>;
  };
};

export type ActSafetyLevelDocumentPayload = {
  documentType: "act_safety_level_of_ISPDn";
  manualData: {
    commission_members: Array<{
      employee_id: number;
    }>;
  };
};

export type GenerateIspdnDocumentPayload = ActIspdnCommissioningDocumentPayload | ActSafetyLevelDocumentPayload;

export type GeneratedDocumentFile = {
  blob: Blob;
  filename: string;
};
