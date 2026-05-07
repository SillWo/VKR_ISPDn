import { z } from "zod";

export const departmentFormSchema = z.object({
  name: z.string().trim().min(1, "Укажите название подразделения"),
});

export type DepartmentFormSchema = z.infer<typeof departmentFormSchema>;

export const defaultDepartmentFormValues: DepartmentFormSchema = {
  name: "",
};
