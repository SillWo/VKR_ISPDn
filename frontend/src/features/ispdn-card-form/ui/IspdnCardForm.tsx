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
import type { ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";

import type { IspdnFormValues } from "../../../entities/ispdn/model/types";
import { ispdnCardFormSchema } from "../model/schema";

type IspdnCardFormProps = {
  defaultValues: IspdnFormValues;
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (values: IspdnFormValues) => void;
  onCancel: () => void;
};

export function IspdnCardForm({ defaultValues, submitLabel, isSubmitting, onSubmit, onCancel }: IspdnCardFormProps) {
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
    <Stack component="form" spacing={3} onSubmit={handleSubmit(onSubmit)} noValidate>
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
          label="Цели обработки ПДн"
          fullWidth
          required
          multiline
          minRows={3}
          {...register("processingPurposes")}
          error={Boolean(errors.processingPurposes)}
          helperText={errors.processingPurposes?.message ?? "Перечислите цели, ради которых в ИСПДн обрабатываются ПДн."}
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
        <TextField
          label="Ответственный за обработку ПДн"
          fullWidth
          required
          {...register("responsiblePerson")}
          error={Boolean(errors.responsiblePerson)}
          helperText={errors.responsiblePerson?.message ?? "Укажите сотрудника, ответственного за обработку ПДн в этой ИСПДн."}
        />
        <TextField
          label="Состав ИСПДн"
          fullWidth
          required
          multiline
          minRows={4}
          {...register("systemComposition")}
          error={Boolean(errors.systemComposition)}
          helperText={errors.systemComposition?.message ?? "Опишите приложения, базу данных, серверы и ключевые компоненты системы."}
        />
      </FormSection>

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
            helperText={errors.decommissioningDate?.message ?? "Заполняется, если система выведена или планируется к выводу из работы."}
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

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "flex-end" }}>
        <Button variant="outlined" onClick={onCancel} disabled={isSubmitting}>
          Отмена
        </Button>
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? "Сохранение..." : submitLabel}
        </Button>
      </Stack>
    </Stack>
  );
}

type FormSectionProps = {
  title: string;
  children: ReactNode;
};

function FormSection({ title, children }: FormSectionProps) {
  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, bgcolor: "background.paper" }}>
      <Stack spacing={2}>
        <Typography component="h2" variant="h6" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        {children}
      </Stack>
    </Paper>
  );
}
