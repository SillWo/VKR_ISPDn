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

export type RknAccessPersonType = "individual" | "individual_entrepreneur" | "legal_entity" | "foreign_organization";

export type RknAccessPersonFormValues = {
  personType: RknAccessPersonType;
  name: string;
  address: string;
  email: string;
  phone: string;
};

export type RknNotificationFormValues = {
  rknAccessPersons: RknAccessPersonFormValues[];
};

export type RknNotificationChangesFormValues = {
  changeDate: string;
  mainOfficeReg: string;
  rknAccessPersons: RknAccessPersonFormValues[];
};

export type RknNotificationDocumentPayload = {
  documentType: "RKN_notification";
  manualData: {
    rkn_access_persons: Array<{
      person_type: RknAccessPersonType;
      name: string;
      address: string;
      email: string | null;
      phone: string | null;
    }>;
  };
};

export type RknNotificationChangesDocumentPayload = {
  documentType: "RKN_notification_changes";
  manualData: {
    change_date: string;
    main_office_reg: string;
    rkn_access_persons: Array<{
      person_type: RknAccessPersonType;
      name: string;
      address: string;
      email: string | null;
      phone: string | null;
    }>;
  };
};

export type PdnDocumentFormValues = {
  orderNumber: string;
};

export type PdnDocumentPayload = {
  documentType: "PDn_document";
  manualData: {
    order_number: string;
  };
};

export type PdnSecurityFormValues = {
  orderNumber: string;
};

export type PdnSecurityDocumentPayload = {
  documentType: "PDn_security";
  manualData: {
    order_number: string;
  };
};

export type GenerateIspdnDocumentPayload = ActIspdnCommissioningDocumentPayload | ActSafetyLevelDocumentPayload;

export type GenerateGlobalDocumentPayload =
  | RknNotificationDocumentPayload
  | RknNotificationChangesDocumentPayload
  | PdnDocumentPayload
  | PdnSecurityDocumentPayload;

export type GeneratedDocumentFile = {
  blob: Blob;
  filename: string;
};
