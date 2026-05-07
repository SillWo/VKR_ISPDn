export type EmployeeDepartment = {
  id: number;
  name: string;
};

export type Employee = {
  id: number;
  fullName: string;
  position: string;
  documentInitials: string;
  departmentId: number | null;
  department: EmployeeDepartment | null;
  createdAt: string;
  updatedAt: string;
};

export type EmployeeOption = {
  id: number;
  fullName: string;
  position: string;
  documentInitials: string;
  departmentId: number | null;
  departmentName: string | null;
};

export type EmployeeFormValues = {
  fullName: string;
  position: string;
  documentInitials: string;
  departmentId: number | null;
};
