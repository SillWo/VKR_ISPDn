import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
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

import type { IspdnFormValues } from "../../../entities/ispdn/model/types";
import { FormSection } from "../../../shared/ui/FormSection";
import { EmployeeSelect } from "../../../shared/ui/employee-select/EmployeeSelect";
import { ispdnCardFormSchema } from "../model/schema";
import { IspdnSecurityToolsSection } from "./IspdnSecurityToolsSection";

type IspdnCardFormProps = {
  defaultValues: IspdnFormValues;
  submitLabel: string;
  isSubmitting?: boolean;
  legacyResponsiblePerson?: string | null;
  showActions?: boolean;
  showSecurityTools?: boolean;
  onSubmit: (values: IspdnFormValues) => void;
  onCancel: () => void;
};

export function IspdnCardForm({
  defaultValues,
  submitLabel,
  isSubmitting,
  legacyResponsiblePerson,
  showActions = true,
  showSecurityTools = true,
  onSubmit,
  onCancel,
}: IspdnCardFormProps) {
  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<IspdnFormValues>({
    resolver: zodResolver(ispdnCardFormSchema),
    defaultValues,
  });

  return (
    <Stack id="ispdn-card-form" component="form" spacing={3} onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormSection title="Основные сведения">
        <TextField
          label="Название ИСПДн"
          fullWidth
          required
          {...register("name")}
          error={Boolean(errors.name)}
          helperText={errors.name?.message ?? "Укажите рабочее название информационной системы."}
        />
        <TextField
          label="Краткое описание"
          fullWidth
          required
          multiline
          minRows={3}
          {...register("shortDescription")}
          error={Boolean(errors.shortDescription)}
          helperText={errors.shortDescription?.message ?? "Опишите назначение системы и основной контур обработки."}
        />
        <TextField
          label="Сайт ИСПДн"
          fullWidth
          {...register("websiteUrl")}
          error={Boolean(errors.websiteUrl)}
          helperText={errors.websiteUrl?.message ?? "Необязательное поле. Например: https://example.ru"}
        />
      </FormSection>

      <FormSection title="Ответственный и состав системы">
        {legacyResponsiblePerson && !defaultValues.responsibleEmployeeId && (
          <Alert severity="warning">
            Ответственный указан старым текстовым значением. Выберите сотрудника из реестра и сохраните карточку.
          </Alert>
        )}
        <Controller
          name="responsibleEmployeeId"
          control={control}
          render={({ field }) => (
            <EmployeeSelect
              value={field.value}
              onChange={field.onChange}
              label="Ответственный за обработку ПДн"
              required
              allowQuickCreate
              quickCreateButtonPlacement="inline"
              disabled={isSubmitting}
              error={Boolean(errors.responsibleEmployeeId)}
              helperText={
                errors.responsibleEmployeeId?.message ??
                "Выберите сотрудника, ответственного за обработку ПДн в этой ИСПДн."
              }
            />
          )}
        />
        <TextField
          label="Состав ИСПДн"
          fullWidth
          required
          multiline
          minRows={4}
          {...register("systemComposition")}
          error={Boolean(errors.systemComposition)}
          helperText={errors.systemComposition?.message ?? "Опишите приложения, базу данных, серверы и компоненты системы."}
        />
      </FormSection>

      {showSecurityTools && (
        <IspdnSecurityToolsSection control={control} errors={errors} isSubmitting={isSubmitting} />
      )}

      <FormSection title="Даты и статус">
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            label="Дата ввода в работу"
            type="date"
            fullWidth
            required
            slotProps={{ inputLabel: { shrink: true } }}
            {...register("commissioningDate")}
            error={Boolean(errors.commissioningDate)}
            helperText={errors.commissioningDate?.message ?? "Дата начала эксплуатации ИСПДн."}
          />
          <TextField
            label="Дата вывода из работы"
            type="date"
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
            {...register("decommissioningDate")}
            error={Boolean(errors.decommissioningDate)}
            helperText={errors.decommissioningDate?.message ?? "Заполняется, если система выведена или планируется к выводу."}
          />
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={Boolean(errors.status)}>
                <InputLabel id="ispdn-status-label">Статус</InputLabel>
                <Select labelId="ispdn-status-label" label="Статус" {...field}>
                  <MenuItem value="active">Работает</MenuItem>
                  <MenuItem value="archived">Архив</MenuItem>
                </Select>
                <FormHelperText>{errors.status?.message ?? "Текущий статус карточки в реестре."}</FormHelperText>
              </FormControl>
            )}
          />
        </Stack>
      </FormSection>

      {showActions && (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "flex-end" }}>
          <Button variant="outlined" onClick={onCancel} disabled={isSubmitting}>
            Отмена
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? "Сохранение..." : submitLabel}
          </Button>
        </Stack>
      )}
    </Stack>
  );
}
