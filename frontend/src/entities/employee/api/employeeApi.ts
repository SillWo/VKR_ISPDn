import { buildApiUrl, httpClient, HttpError } from "../../../shared/api/httpClient";
import type { Employee, EmployeeFormValues, EmployeeOption } from "../model/types";

type EmployeeDepartmentDto = {
  id: number;
  name: string;
};

type EmployeeDto = {
  id: number;
  full_name: string;
  position: string;
  document_initials: string;
  phone_number: string | null;
  email: string | null;
  department_id: number | null;
  department: EmployeeDepartmentDto | null;
  created_at: string;
  updated_at: string;
};

type EmployeeOptionDto = {
  id: number;
  full_name: string;
  position: string;
  document_initials: string;
  phone_number: string | null;
  email: string | null;
  department_id: number | null;
  department_name: string | null;
};

type EmployeePayloadDto = {
  full_name: string;
  position: string;
  document_initials: string;
  phone_number: string | null;
  email: string | null;
  department_id: number | null;
};

function mapEmployee(dto: EmployeeDto): Employee {
  return {
    id: dto.id,
    fullName: dto.full_name,
    position: dto.position,
    documentInitials: dto.document_initials,
    phoneNumber: dto.phone_number,
    email: dto.email,
    departmentId: dto.department_id,
    department: dto.department,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

function mapEmployeeOption(dto: EmployeeOptionDto): EmployeeOption {
  return {
    id: dto.id,
    fullName: dto.full_name,
    position: dto.position,
    documentInitials: dto.document_initials,
    phoneNumber: dto.phone_number,
    email: dto.email,
    departmentId: dto.department_id,
    departmentName: dto.department_name,
  };
}

function mapPayload(values: EmployeeFormValues): EmployeePayloadDto {
  return {
    full_name: values.fullName.trim(),
    position: values.position.trim(),
    document_initials: values.documentInitials.trim(),
    phone_number: values.phoneNumber.trim() || null,
    email: values.email.trim() || null,
    department_id: values.departmentId,
  };
}

export function getEmployees() {
  return httpClient<EmployeeDto[]>("/api/v1/employees").then((items) => items.map(mapEmployee));
}

export function getEmployeeOptions() {
  return httpClient<EmployeeOptionDto[]>("/api/v1/employees/options").then((items) => items.map(mapEmployeeOption));
}

export function createEmployee(payload: EmployeeFormValues) {
  return httpClient<EmployeeDto>("/api/v1/employees", {
    method: "POST",
    body: JSON.stringify(mapPayload(payload)),
  }).then(mapEmployee);
}

export function updateEmployee(id: number, payload: EmployeeFormValues) {
  return httpClient<EmployeeDto>(`/api/v1/employees/${id}`, {
    method: "PUT",
    body: JSON.stringify(mapPayload(payload)),
  }).then(mapEmployee);
}

export async function deleteEmployee(id: number) {
  const response = await fetch(buildApiUrl(`/api/v1/employees/${id}`), {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new HttpError(response.status, response.statusText);
  }
}
