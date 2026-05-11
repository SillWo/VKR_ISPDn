import { z } from "zod";

import { requiredText } from "../../../shared/lib/validation";

export const employeeFormSchema = z.object({
  fullName: requiredText("Укажите ФИО сотрудника"),
  position: requiredText("Укажите должность"),
  documentInitials: requiredText("Укажите инициалы для документов"),
  phoneNumber: z
    .string()
    .trim()
    .refine((value) => !value || /^\+7 \(\d{3}\) \d{3} \d{2} \d{2}$/.test(value), {
      message: "Укажите номер в формате +7 (999) 999 99 99",
    }),
  email: z.string().trim().refine((value) => !value || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value), {
    message: "Укажите корректный адрес электронной почты",
  }),
  departmentId: z.number().nullable(),
});

export type EmployeeFormSchema = z.infer<typeof employeeFormSchema>;

export const defaultEmployeeFormValues: EmployeeFormSchema = {
  fullName: "",
  position: "",
  documentInitials: "",
  phoneNumber: "",
  email: "",
  departmentId: null,
};
