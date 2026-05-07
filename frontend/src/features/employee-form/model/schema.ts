import { z } from "zod";

const requiredText = (message: string) => z.string().trim().min(1, message);

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
