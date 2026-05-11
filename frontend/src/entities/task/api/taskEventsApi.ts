import { httpClient } from "../../../shared/api/httpClient";
import type { EmployeeOption } from "../../employee/model/types";
import type { ActualTask, Task, TaskEvent, TaskEventFilters, TaskFormValues } from "../model/types";

type EmployeeOptionDto = {
  id: number;
  full_name: string;
  position: string;
  document_initials: string;
  phone_number?: string | null;
  email?: string | null;
  department_id: number | null;
  department_name: string | null;
};

type TaskDto = {
  id: number;
  task_event_id: number;
  title: string;
  description: string | null;
  importance: Task["importance"];
  deadline: string | null;
  responsible_employee_id: number | null;
  responsible_employee: EmployeeOptionDto | null;
  status: Task["status"];
  created_at: string;
  updated_at: string;
};

type TaskEventDto = {
  id: number;
  ispdn_id: number;
  ispdn: {
    id: number;
    name: string;
  };
  event_type: string;
  source_module: string;
  title: string;
  description: string | null;
  tasks: TaskDto[];
  created_at: string;
  updated_at: string;
};

type ActualTaskDto = TaskDto & {
  task_event_title: string;
  ispdn_id: number;
  ispdn_name: string;
};

type TaskPayloadDto = {
  title: string;
  description: string | null;
  importance: Task["importance"];
  deadline: string | null;
  responsible_employee_id: number | null;
  status: Task["status"];
};

function mapEmployee(dto: EmployeeOptionDto | null): EmployeeOption | null {
  if (!dto) {
    return null;
  }
  return {
    id: dto.id,
    fullName: dto.full_name,
    position: dto.position,
    documentInitials: dto.document_initials,
    phoneNumber: dto.phone_number ?? null,
    email: dto.email ?? null,
    departmentId: dto.department_id,
    departmentName: dto.department_name,
  };
}

function mapTask(dto: TaskDto): Task {
  return {
    id: dto.id,
    taskEventId: dto.task_event_id,
    title: dto.title,
    description: dto.description,
    importance: dto.importance,
    deadline: dto.deadline,
    responsibleEmployeeId: dto.responsible_employee_id,
    responsibleEmployee: mapEmployee(dto.responsible_employee),
    status: dto.status,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

function mapTaskEvent(dto: TaskEventDto): TaskEvent {
  return {
    id: dto.id,
    ispdnId: dto.ispdn_id,
    ispdn: dto.ispdn,
    eventType: dto.event_type,
    sourceModule: dto.source_module,
    title: dto.title,
    description: dto.description,
    tasks: dto.tasks.map(mapTask),
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

function mapActualTask(dto: ActualTaskDto): ActualTask {
  return {
    ...mapTask(dto),
    taskEventTitle: dto.task_event_title,
    ispdnId: dto.ispdn_id,
    ispdnName: dto.ispdn_name,
  };
}

function mapPayload(values: TaskFormValues): TaskPayloadDto {
  return {
    title: values.title.trim(),
    description: values.description?.trim() || null,
    importance: values.importance,
    deadline: values.deadline || null,
    responsible_employee_id: values.responsibleEmployeeId,
    status: values.status,
  };
}

function buildTaskEventQuery(filters?: TaskEventFilters): string {
  const searchParams = new URLSearchParams();
  if (filters?.ispdnId) {
    searchParams.set("ispdn_id", String(filters.ispdnId));
  }
  if (filters?.taskStatus) {
    searchParams.set("task_status", filters.taskStatus);
  }
  if (filters?.importance) {
    searchParams.set("importance", filters.importance);
  }
  if (filters?.responsibleEmployeeId) {
    searchParams.set("responsible_employee_id", String(filters.responsibleEmployeeId));
  }
  if (filters?.actualOnly) {
    searchParams.set("actual_only", "true");
  }
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function getTaskEvents(filters?: TaskEventFilters) {
  return httpClient<TaskEventDto[]>(`/api/v1/task-events${buildTaskEventQuery(filters)}`).then((items) =>
    items.map(mapTaskEvent),
  );
}

export function getTaskEventById(taskEventId: number) {
  return httpClient<TaskEventDto>(`/api/v1/task-events/${taskEventId}`).then(mapTaskEvent);
}

export function createTask(taskEventId: number, payload: TaskFormValues) {
  return httpClient<TaskDto>(`/api/v1/task-events/${taskEventId}/tasks`, {
    method: "POST",
    body: JSON.stringify(mapPayload(payload)),
  }).then(mapTask);
}

export function updateTask(taskEventId: number, taskId: number, payload: TaskFormValues) {
  return httpClient<TaskDto>(`/api/v1/task-events/${taskEventId}/tasks/${taskId}`, {
    method: "PUT",
    body: JSON.stringify(mapPayload(payload)),
  }).then(mapTask);
}

export function deleteTask(taskEventId: number, taskId: number) {
  return httpClient<void>(`/api/v1/task-events/${taskEventId}/tasks/${taskId}`, {
    method: "DELETE",
  });
}

export function getActualTasksByIspdnId(ispdnId: number) {
  return httpClient<ActualTaskDto[]>(`/api/v1/ispdns/${ispdnId}/tasks/actual`).then((items) =>
    items.map(mapActualTask),
  );
}
