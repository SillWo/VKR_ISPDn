import { httpClient } from "../../../shared/api/httpClient";
import type {
  ProcessingPurpose,
  ProcessingPurposeFormValues,
  ProcessingPurposeOption,
} from "../model/types";

type ProcessingPurposeDto = {
  id: number;
  name: string;
  processing_period: string;
  created_at: string;
  updated_at: string;
};

type ProcessingPurposeOptionDto = {
  id: number;
  name: string;
  processing_period: string;
};

type ProcessingPurposePayloadDto = {
  name: string;
  processing_period: string;
};

function mapPurpose(dto: ProcessingPurposeDto): ProcessingPurpose {
  return {
    id: dto.id,
    name: dto.name,
    processingPeriod: dto.processing_period,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

function mapOption(dto: ProcessingPurposeOptionDto): ProcessingPurposeOption {
  return {
    id: dto.id,
    name: dto.name,
    processingPeriod: dto.processing_period,
  };
}

function mapPayload(values: ProcessingPurposeFormValues): ProcessingPurposePayloadDto {
  return {
    name: values.name.trim(),
    processing_period: values.processingPeriod.trim(),
  };
}

export function getProcessingPurposes() {
  return httpClient<ProcessingPurposeDto[]>("/api/v1/processing-purposes").then((items) => items.map(mapPurpose));
}

export function getProcessingPurposeOptions() {
  return httpClient<ProcessingPurposeOptionDto[]>("/api/v1/processing-purposes/options").then((items) =>
    items.map(mapOption),
  );
}

export function getProcessingPurposeById(id: number) {
  return httpClient<ProcessingPurposeDto>(`/api/v1/processing-purposes/${id}`).then(mapPurpose);
}

export function createProcessingPurpose(payload: ProcessingPurposeFormValues) {
  return httpClient<ProcessingPurposeDto>("/api/v1/processing-purposes", {
    method: "POST",
    body: JSON.stringify(mapPayload(payload)),
  }).then(mapPurpose);
}

export function updateProcessingPurpose(id: number, payload: ProcessingPurposeFormValues) {
  return httpClient<ProcessingPurposeDto>(`/api/v1/processing-purposes/${id}`, {
    method: "PUT",
    body: JSON.stringify(mapPayload(payload)),
  }).then(mapPurpose);
}

export function deleteProcessingPurpose(id: number) {
  return httpClient<void>(`/api/v1/processing-purposes/${id}`, { method: "DELETE" });
}
