import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Stack, TextField } from "@mui/material";
import { useForm } from "react-hook-form";

import type { DepartmentFormValues } from "../../../entities/department/model/types";
import { departmentFormSchema } from "../model/schema";

type DepartmentFormProps = {
  defaultValues: DepartmentFormValues;
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (values: DepartmentFormValues) => void;
  onCancel: () => void;
};

export function DepartmentForm({
  defaultValues,
  submitLabel,
  isSubmitting,
  onSubmit,
  onCancel,
}: DepartmentFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues,
  });

  return (
    <Stack component="form" spacing={2} onSubmit={handleSubmit(onSubmit)} noValidate>
      <TextField
        label="Название подразделения"
        fullWidth
        required
        disabled={isSubmitting}
        error={Boolean(errors.name)}
        helperText={errors.name?.message}
        {...register("name")}
      />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "flex-end" }}>
        <Button type="button" variant="outlined" disabled={isSubmitting} onClick={onCancel}>
          Отмена
        </Button>
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? "Сохранение..." : submitLabel}
        </Button>
      </Stack>
    </Stack>
  );
}
