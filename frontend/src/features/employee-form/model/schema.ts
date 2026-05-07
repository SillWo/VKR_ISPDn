import { z } from "zod";

import { requiredText } from "../../../shared/lib/validation";

export const employeeFormSchema = z.object({
  fullName: requiredText("Укажите ФИО сотрудника"),
  position: requiredText("Укажите должность"),
  documentInitials: requiredText("Укажите инициалы для документов"),
  departmentId: z.number().nullable(),
});

export type EmployeeFormSchema = z.infer<typeof employeeFormSchema>;

export const defaultEmployeeFormValues: EmployeeFormSchema = {
  fullName: "",
  position: "",
  documentInitials: "",
  departmentId: null,
};
