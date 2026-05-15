import type { EmployeeOption } from "../../employee/model/types";

export type TaskImportance = "low" | "medium" | "high" | "critical";
export type TaskStatus = "pending" | "in_progress" | "done";

export type TaskIspdnShort = {
  id: number;
  name: string;
};

export type Task = {
  id: number;
  taskEventId: number;
  automationKey?: string | null;
  title: string;
  description: string | null;
  importance: TaskImportance | null;
  deadline: string | null;
  responsibleEmployeeId: number | null;
  responsibleEmployee: EmployeeOption | null;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
};

export type TaskEvent = {
  id: number;
  ispdnId: number | null;
  ispdn: TaskIspdnShort | null;
  eventType: string;
  sourceModule: string;
  automationKey?: string | null;
  title: string;
  description: string | null;
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
};

export type ActualTask = Task & {
  taskEventTitle: string;
  ispdnId: number;
  ispdnName: string;
};

export type TaskFormValues = {
  title: string;
  description: string | null;
  importance: TaskImportance | null;
  deadline: string | null;
  responsibleEmployeeId: number | null;
  status: TaskStatus;
};

export type TaskEventCreateFormValues = {
  ispdnId: number | null;
  title: string;
  description: string | null;
};

export type TaskEventFilters = {
  ispdnId?: number | null;
  taskStatus?: TaskStatus | null;
  importance?: TaskImportance | null;
  responsibleEmployeeId?: number | null;
  actualOnly?: boolean;
  showCompleted?: boolean;
};
