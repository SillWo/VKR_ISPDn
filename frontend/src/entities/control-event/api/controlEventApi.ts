import { buildApiUrl, httpClient } from "../../../shared/api/httpClient";
import type {
  ControlEvent,
  ControlEventFile,
  ControlEventFormValues,
  ControlEventOption,
} from "../model/types";

type ControlEventFileDto = {
  id: number;
  control_event_id: number;
  file_name: string;
  file_content_type: string;
  file_size_bytes: number;
  created_at: string;
};

type ControlEventDto = {
  id: number;
  name: string;
  description: string;
  files: ControlEventFileDto[];
  created_at: string;
  updated_at: string;
};

type ControlEventOptionDto = {
  id: number;
  name: string;
  description: string;
};

type ControlEventPayloadDto = {
  name: string;
  description: string;
};

function mapFile(dto: ControlEventFileDto): ControlEventFile {
  return {
    id: dto.id,
    controlEventId: dto.control_event_id,
    fileName: dto.file_name,
    fileContentType: dto.file_content_type,
    fileSizeBytes: dto.file_size_bytes,
    createdAt: dto.created_at,
  };
}

function mapControlEvent(dto: ControlEventDto): ControlEvent {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    files: dto.files.map(mapFile),
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

function mapOption(dto: ControlEventOptionDto): ControlEventOption {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
  };
}

function mapPayload(values: ControlEventFormValues): ControlEventPayloadDto {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
  };
}

export function getControlEvents() {
  return httpClient<ControlEventDto[]>("/api/v1/control-events").then((items) => items.map(mapControlEvent));
}

export function getControlEventOptions() {
  return httpClient<ControlEventOptionDto[]>("/api/v1/control-events/options").then((items) =>
    items.map(mapOption),
  );
}

export function getControlEventById(id: number) {
  return httpClient<ControlEventDto>(`/api/v1/control-events/${id}`).then(mapControlEvent);
}

export function createControlEvent(payload: ControlEventFormValues) {
  return httpClient<ControlEventDto>("/api/v1/control-events", {
    method: "POST",
    body: JSON.stringify(mapPayload(payload)),
  }).then(mapControlEvent);
}

export function updateControlEvent(id: number, payload: ControlEventFormValues) {
  return httpClient<ControlEventDto>(`/api/v1/control-events/${id}`, {
    method: "PUT",
    body: JSON.stringify(mapPayload(payload)),
  }).then(mapControlEvent);
}

export function deleteControlEvent(id: number) {
  return httpClient<void>(`/api/v1/control-events/${id}`, { method: "DELETE" });
}

export function getControlEventFiles(controlEventId: number) {
  return httpClient<ControlEventFileDto[]>(`/api/v1/control-events/${controlEventId}/files`).then((items) =>
    items.map(mapFile),
  );
}

export function uploadControlEventFile(controlEventId: number, file: File) {
  const formData = new FormData();
  formData.append("control_event_file", file);

  return httpClient<ControlEventFileDto>(`/api/v1/control-events/${controlEventId}/files`, {
    method: "POST",
    body: formData,
  }).then(mapFile);
}

export async function downloadControlEventFile(controlEventId: number, fileId: number) {
  const response = await fetch(buildApiUrl(`/api/v1/control-events/${controlEventId}/files/${fileId}`));
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.blob();
}

export function deleteControlEventFile(controlEventId: number, fileId: number) {
  return httpClient<void>(`/api/v1/control-events/${controlEventId}/files/${fileId}`, {
    method: "DELETE",
  });
}
