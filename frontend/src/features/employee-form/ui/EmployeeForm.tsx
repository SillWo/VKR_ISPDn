import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";

import type { Department } from "../../../entities/department/model/types";
import type { EmployeeFormValues } from "../../../entities/employee/model/types";
import { FormSection } from "../../../shared/ui/FormSection";
import { employeeFormSchema } from "../model/schema";

type EmployeeFormProps = {
  defaultValues: EmployeeFormValues;
  departments: Department[];
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (values: EmployeeFormValues) => void;
  onCancel: () => void;
};

function formatEmployeePhoneInput(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("7") || digits.startsWith("8")) {
    digits = digits.slice(1);
  }
  digits = digits.slice(0, 10);
  if (!digits) {
    return "";
  }
  const first = digits.slice(0, 3);
  const second = digits.slice(3, 6);
  const third = digits.slice(6, 8);
  const fourth = digits.slice(8, 10);
  let formatted = `+7 (${first}`;
  if (first.length === 3) {
    formatted += ")";
  }
  if (second) {
    formatted += ` ${second}`;
  }
  if (third) {
    formatted += ` ${third}`;
  }
  if (fourth) {
    formatted += ` ${fourth}`;
  }
  return formatted;
}

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
      <FormSection title="Сведения о сотруднике">
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
            name="phoneNumber"
            control={control}
            render={({ field }) => (
              <TextField
                label="Номер телефона"
                fullWidth
                disabled={isSubmitting}
                value={field.value}
                onChange={(event) => field.onChange(formatEmployeePhoneInput(event.target.value))}
                error={Boolean(errors.phoneNumber)}
                helperText={errors.phoneNumber?.message ?? "Формат: +7 (999) 999 99 99."}
              />
            )}
          />
          <TextField
            label="Электронная почта"
            fullWidth
            disabled={isSubmitting}
            error={Boolean(errors.email)}
            helperText={errors.email?.message}
            {...register("email")}
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
      </FormSection>

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
