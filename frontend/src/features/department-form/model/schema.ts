import { z } from "zod";

import { requiredText } from "../../../shared/lib/validation";

export const departmentFormSchema = z.object({
  name: requiredText("Укажите название подразделения"),
});

export type DepartmentFormSchema = z.infer<typeof departmentFormSchema>;

export const defaultDepartmentFormValues: DepartmentFormSchema = {
  name: "",
};
