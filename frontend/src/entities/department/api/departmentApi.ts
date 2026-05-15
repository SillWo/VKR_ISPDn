import { authHeaders, buildApiUrl, httpClient, HttpError } from "../../../shared/api/httpClient";
import type { Department, DepartmentFormValues } from "../model/types";

type DepartmentDto = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
};

type DepartmentPayloadDto = {
  name: string;
};

function mapDepartment(dto: DepartmentDto): Department {
  return {
    id: dto.id,
    name: dto.name,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

function mapPayload(values: DepartmentFormValues): DepartmentPayloadDto {
  return {
    name: values.name.trim(),
  };
}

export function getDepartments() {
  return httpClient<DepartmentDto[]>("/api/v1/departments").then((items) => items.map(mapDepartment));
}

export function createDepartment(payload: DepartmentFormValues) {
  return httpClient<DepartmentDto>("/api/v1/departments", {
    method: "POST",
    body: JSON.stringify(mapPayload(payload)),
  }).then(mapDepartment);
}

export function updateDepartment(id: number, payload: DepartmentFormValues) {
  return httpClient<DepartmentDto>(`/api/v1/departments/${id}`, {
    method: "PUT",
    body: JSON.stringify(mapPayload(payload)),
  }).then(mapDepartment);
}

export async function deleteDepartment(id: number) {
  const response = await fetch(buildApiUrl(`/api/v1/departments/${id}`), {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new HttpError(response.status, response.statusText);
  }
}
