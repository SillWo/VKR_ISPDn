import { httpClient } from "../../../shared/api/httpClient";
import type { ProcessingPurposeOption } from "../../processing-purpose/model/types";
import type {
  ProcessingProcess,
  ProcessingProcessDocumentContext,
  ProcessingProcessFormValues,
} from "../model/types";
import type { InternalNetworkTransfer, InternetTransfer, ProcessingType } from "../model/catalogs";

type ProcessingPurposeOptionDto = {
  id: number;
  name: string;
  processing_period: string;
};

type ProcessingProcessDto = {
  id: number;
  ispdn_id: number;
  processing_purpose_id: number;
  processing_purpose: ProcessingPurposeOptionDto;
  subject_categories: Record<string, boolean>;
  data_categories: Record<string, boolean | string>;
  legal_bases: Record<string, boolean>;
  personal_data_actions: Record<string, boolean | string>;
  processing_type: ProcessingType;
  internal_network_transfer: InternalNetworkTransfer;
  internet_transfer: InternetTransfer;
  cross_border_transfer: boolean;
  created_at: string;
  updated_at: string;
};

type ProcessingProcessPayloadDto = {
  processing_purpose_id: number;
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
    purpose: ProcessingPurposeOptionDto;
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
};

function mapPurpose(dto: ProcessingPurposeOptionDto): ProcessingPurposeOption {
  return {
    id: dto.id,
    name: dto.name,
    processingPeriod: dto.processing_period,
  };
}

function mapProcess(dto: ProcessingProcessDto): ProcessingProcess {
  return {
    id: dto.id,
    ispdnId: dto.ispdn_id,
    processingPurposeId: dto.processing_purpose_id,
    processingPurpose: mapPurpose(dto.processing_purpose),
    subjectCategories: dto.subject_categories,
    dataCategories: dto.data_categories,
    legalBases: dto.legal_bases,
    personalDataActions: dto.personal_data_actions,
    processingType: dto.processing_type,
    internalNetworkTransfer: dto.internal_network_transfer,
    internetTransfer: dto.internet_transfer,
    crossBorderTransfer: dto.cross_border_transfer,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

function mapPayload(values: ProcessingProcessFormValues): ProcessingProcessPayloadDto {
  if (!values.processingPurposeId || !values.processingType || !values.internalNetworkTransfer || !values.internetTransfer) {
    throw new Error("Processing process form is incomplete");
  }

  return {
    processing_purpose_id: values.processingPurposeId,
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
      purpose: mapPurpose(process.purpose),
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
  };
}

export function getIspdnProcessingProcesses(ispdnId: number) {
  return httpClient<ProcessingProcessDto[]>(`/api/v1/ispdns/${ispdnId}/processing-processes`).then((items) =>
    items.map(mapProcess),
  );
}

export function getIspdnProcessingProcessById(ispdnId: number, processId: number) {
  return httpClient<ProcessingProcessDto>(`/api/v1/ispdns/${ispdnId}/processing-processes/${processId}`).then(
    mapProcess,
  );
}

export function createIspdnProcessingProcess(ispdnId: number, payload: ProcessingProcessFormValues) {
  return httpClient<ProcessingProcessDto>(`/api/v1/ispdns/${ispdnId}/processing-processes`, {
    method: "POST",
    body: JSON.stringify(mapPayload(payload)),
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

export function deleteIspdnProcessingProcess(ispdnId: number, processId: number) {
  return httpClient<void>(`/api/v1/ispdns/${ispdnId}/processing-processes/${processId}`, { method: "DELETE" });
}

export function getIspdnProcessingProcessesDocumentContext(ispdnId: number) {
  return httpClient<ProcessingProcessDocumentContextDto>(
    `/api/v1/ispdns/${ispdnId}/processing-processes/document-context`,
  ).then(mapDocumentContext);
}
