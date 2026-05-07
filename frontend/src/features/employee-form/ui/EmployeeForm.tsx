import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";

import type { Department } from "../../../entities/department/model/types";
import type { EmployeeFormValues } from "../../../entities/employee/model/types";
import { employeeFormSchema } from "../model/schema";

type EmployeeFormProps = {
  defaultValues: EmployeeFormValues;
  departments: Department[];
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (values: EmployeeFormValues) => void;
  onCancel: () => void;
};

export function EmployeeForm({
  defaultValues,
  departments,
  submitLabel,
  isSubmitting,
  onSubmit,
  onCancel,
}: EmployeeFormProps) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues,
  });

  return (
    <Stack component="form" spacing={3} onSubmit={handleSubmit(onSubmit)} noValidate>
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, bgcolor: "background.paper" }}>
        <Stack spacing={2}>
          <Typography component="h2" variant="h6" sx={{ fontWeight: 600 }}>
            Сведения о сотруднике
          </Typography>
          <TextField
            label="ФИО"
            fullWidth
            required
            disabled={isSubmitting}
            error={Boolean(errors.fullName)}
            helperText={errors.fullName?.message}
            {...register("fullName")}
          />
          <TextField
            label="Должность"
            fullWidth
            required
            disabled={isSubmitting}
            error={Boolean(errors.position)}
            helperText={errors.position?.message}
            {...register("position")}
          />
          <TextField
            label="Инициалы для документов"
            fullWidth
            required
            disabled={isSubmitting}
            error={Boolean(errors.documentInitials)}
            helperText={errors.documentInitials?.message ?? "Например: Иванов И.И."}
            {...register("documentInitials")}
          />
          <Controller
            name="departmentId"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={Boolean(errors.departmentId)} disabled={isSubmitting}>
                <InputLabel id="employee-department-label">Подразделение</InputLabel>
                <Select
                  labelId="employee-department-label"
                  label="Подразделение"
                  value={field.value ?? ""}
                  onChange={(event) => {
                    const value = event.target.value as string | number;
                    field.onChange(value === "" ? null : Number(value));
                  }}
                >
                  <MenuItem value="">Без подразделения</MenuItem>
                  {departments.map((department) => (
                    <MenuItem key={department.id} value={department.id}>
                      {department.name}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  {errors.departmentId?.message ?? "Поле необязательное. Сотрудник может быть без подразделения."}
                </FormHelperText>
              </FormControl>
            )}
          />
        </Stack>
      </Paper>

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
