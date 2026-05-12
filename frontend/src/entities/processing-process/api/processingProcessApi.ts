import { httpClient } from "../../../shared/api/httpClient";
import type { InternalNetworkTransfer, InternetTransfer, ProcessingType } from "../model/catalogs";
import type {
  LinkedIspdnShort,
  ProcessingProcess,
  ProcessingProcessDocumentContext,
  ProcessingProcessFormValues,
  ProcessingProcessOption,
  ProcessingProcessRegistryItem,
} from "../model/types";

type LinkedIspdnDto = {
  id: number;
  name: string;
  status: string;
};

type ProcessingProcessDto = {
  id: number;
  name: string;
  purpose_name: string;
  processing_period: string;
  subject_categories: Record<string, boolean>;
  data_categories: Record<string, boolean | string>;
  legal_bases: Record<string, boolean>;
  personal_data_actions: Record<string, boolean | string>;
  processing_type: ProcessingType;
  internal_network_transfer: InternalNetworkTransfer;
  internet_transfer: InternetTransfer;
  cross_border_transfer: boolean;
  process_signature: string;
  linked_ispdns: LinkedIspdnDto[];
  linked_ispdns_count: number;
  created_at: string;
  updated_at: string;
};

type ProcessingProcessRegistryItemDto = {
  id: number;
  name: string;
  purpose_name: string;
  processing_period: string;
  linked_ispdns_count: number;
  linked_ispdns: LinkedIspdnDto[];
  created_at: string;
  updated_at: string;
};

type ProcessingProcessOptionDto = {
  id: number;
  name: string;
  purpose_name: string;
  processing_period: string;
};

type ProcessingProcessPayloadDto = {
  purpose_name: string;
  processing_period: string;
  subject_categories: Record<string, boolean>;
  data_categories: Record<string, boolean | string>;
  legal_bases: Record<string, boolean>;
  personal_data_actions: Record<string, boolean | string>;
  processing_type: ProcessingType;
  internal_network_transfer: InternalNetworkTransfer;
  internet_transfer: InternetTransfer;
  cross_border_transfer: boolean;
};

type ProcessingProcessDocumentContextDto = {
  ispdn_id: number;
  processes: Array<{
    id: number;
    name: string;
    purpose_name: string;
    processing_period: string;
    subject_categories: string[];
    data_categories: string[];
    legal_bases: string[];
    personal_data_actions: string[];
    processing_methods: {
      processing_type: string;
      internal_network_transfer: string;
      internet_transfer: string;
      cross_border_transfer: boolean;
    };
  }>;
  processing_purpose_periods: Array<{
    purpose_name: string;
    processing_period: string;
  }>;
};

function mapLinkedIspdn(dto: LinkedIspdnDto): LinkedIspdnShort {
  return {
    id: dto.id,
    name: dto.name,
    status: dto.status,
  };
}

function mapProcess(dto: ProcessingProcessDto): ProcessingProcess {
  return {
    id: dto.id,
    name: dto.purpose_name,
    purposeName: dto.purpose_name,
    processingPeriod: dto.processing_period,
    subjectCategories: dto.subject_categories,
    dataCategories: dto.data_categories,
    legalBases: dto.legal_bases,
    personalDataActions: dto.personal_data_actions,
    processingType: dto.processing_type,
    internalNetworkTransfer: dto.internal_network_transfer,
    internetTransfer: dto.internet_transfer,
    crossBorderTransfer: dto.cross_border_transfer,
    processSignature: dto.process_signature,
    linkedIspdns: dto.linked_ispdns.map(mapLinkedIspdn),
    linkedIspdnsCount: dto.linked_ispdns_count,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

function mapRegistryItem(dto: ProcessingProcessRegistryItemDto): ProcessingProcessRegistryItem {
  return {
    id: dto.id,
    name: dto.purpose_name,
    purposeName: dto.purpose_name,
    processingPeriod: dto.processing_period,
    linkedIspdnsCount: dto.linked_ispdns_count,
    linkedIspdns: dto.linked_ispdns.map(mapLinkedIspdn),
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

function mapOption(dto: ProcessingProcessOptionDto): ProcessingProcessOption {
  return {
    id: dto.id,
    name: dto.purpose_name,
    purposeName: dto.purpose_name,
    processingPeriod: dto.processing_period,
  };
}

function mapPayload(values: ProcessingProcessFormValues): ProcessingProcessPayloadDto {
  if (!values.processingType || !values.internalNetworkTransfer || !values.internetTransfer) {
    throw new Error("Processing process form is incomplete");
  }

  return {
    purpose_name: values.purposeName.trim(),
    processing_period: values.processingPeriod.trim(),
    subject_categories: values.subjectCategories,
    data_categories: values.dataCategories,
    legal_bases: values.legalBases,
    personal_data_actions: values.personalDataActions,
    processing_type: values.processingType,
    internal_network_transfer: values.internalNetworkTransfer,
    internet_transfer: values.internetTransfer,
    cross_border_transfer: values.crossBorderTransfer,
  };
}

function mapDocumentContext(dto: ProcessingProcessDocumentContextDto): ProcessingProcessDocumentContext {
  return {
    ispdnId: dto.ispdn_id,
    processes: dto.processes.map((process) => ({
      id: process.id,
      name: process.purpose_name,
      purposeName: process.purpose_name,
      processingPeriod: process.processing_period,
      subjectCategories: process.subject_categories,
      dataCategories: process.data_categories,
      legalBases: process.legal_bases,
      personalDataActions: process.personal_data_actions,
      processingMethods: {
        processingType: process.processing_methods.processing_type,
        internalNetworkTransfer: process.processing_methods.internal_network_transfer,
        internetTransfer: process.processing_methods.internet_transfer,
        crossBorderTransfer: process.processing_methods.cross_border_transfer,
      },
    })),
    processingPurposePeriods: dto.processing_purpose_periods.map((item) => ({
      purposeName: item.purpose_name,
      processingPeriod: item.processing_period,
    })),
  };
}

export function getProcessingProcesses() {
  return httpClient<ProcessingProcessRegistryItemDto[]>("/api/v1/processing-processes").then((items) =>
    items.map(mapRegistryItem),
  );
}

export function getProcessingProcessOptions() {
  return httpClient<ProcessingProcessOptionDto[]>("/api/v1/processing-processes/options").then((items) =>
    items.map(mapOption),
  );
}

export function getUniqueActiveProcessingProcesses() {
  return httpClient<ProcessingProcessDto[]>("/api/v1/processing-processes/active-unique").then((items) =>
    items.map(mapProcess),
  );
}

export function getProcessingProcessById(processId: number) {
  return httpClient<ProcessingProcessDto>(`/api/v1/processing-processes/${processId}`).then(mapProcess);
}

export function createProcessingProcess(payload: ProcessingProcessFormValues) {
  return httpClient<ProcessingProcessDto>("/api/v1/processing-processes", {
    method: "POST",
    body: JSON.stringify(mapPayload(payload)),
  }).then(mapProcess);
}

export function updateProcessingProcess(processId: number, payload: ProcessingProcessFormValues) {
  return httpClient<ProcessingProcessDto>(`/api/v1/processing-processes/${processId}`, {
    method: "PUT",
    body: JSON.stringify(mapPayload(payload)),
  }).then(mapProcess);
}

export function deleteProcessingProcess(processId: number) {
  return httpClient<void>(`/api/v1/processing-processes/${processId}`, { method: "DELETE" });
}

export function getIspdnProcessingProcesses(ispdnId: number) {
  return httpClient<ProcessingProcessDto[]>(`/api/v1/ispdns/${ispdnId}/processing-processes`).then((items) =>
    items.map(mapProcess),
  );
}

export function createAndLinkIspdnProcessingProcess(ispdnId: number, payload: ProcessingProcessFormValues) {
  return httpClient<ProcessingProcessDto>(`/api/v1/ispdns/${ispdnId}/processing-processes`, {
    method: "POST",
    body: JSON.stringify(mapPayload(payload)),
  }).then(mapProcess);
}

export function linkExistingProcessingProcessToIspdn(ispdnId: number, processId: number) {
  return httpClient<ProcessingProcessDto>(`/api/v1/ispdns/${ispdnId}/processing-processes/link`, {
    method: "POST",
    body: JSON.stringify({ processing_process_id: processId }),
  }).then(mapProcess);
}

export function updateIspdnProcessingProcess(
  ispdnId: number,
  processId: number,
  payload: ProcessingProcessFormValues,
) {
  return httpClient<ProcessingProcessDto>(`/api/v1/ispdns/${ispdnId}/processing-processes/${processId}`, {
    method: "PUT",
    body: JSON.stringify(mapPayload(payload)),
  }).then(mapProcess);
}

export function unlinkIspdnProcessingProcess(ispdnId: number, processId: number) {
  return httpClient<void>(`/api/v1/ispdns/${ispdnId}/processing-processes/${processId}`, { method: "DELETE" });
}

export function getIspdnProcessingProcessDocumentContext(ispdnId: number) {
  return httpClient<ProcessingProcessDocumentContextDto>(
    `/api/v1/ispdns/${ispdnId}/processing-processes/document-context`,
  ).then(mapDocumentContext);
}
