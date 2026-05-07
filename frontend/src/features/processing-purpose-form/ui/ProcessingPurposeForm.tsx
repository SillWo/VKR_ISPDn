import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Stack, TextField } from "@mui/material";
import { useForm } from "react-hook-form";

import type { ProcessingPurposeFormValues } from "../../../entities/processing-purpose/model/types";
import { processingPurposeFormSchema } from "../model/schema";

type ProcessingPurposeFormProps = {
  defaultValues: ProcessingPurposeFormValues;
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (values: ProcessingPurposeFormValues) => void;
  onCancel: () => void;
};

export function ProcessingPurposeForm({
  defaultValues,
  submitLabel,
  isSubmitting,
  onSubmit,
  onCancel,
}: ProcessingPurposeFormProps) {
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<ProcessingPurposeFormValues>({
    resolver: zodResolver(processingPurposeFormSchema),
    defaultValues,
  });

  return (
    <Stack component="form" spacing={2.5} onSubmit={handleSubmit(onSubmit)} noValidate>
      <TextField
        label="Название"
        fullWidth
        required
        {...register("name")}
        error={Boolean(errors.name)}
        helperText={errors.name?.message ?? "Например: Ведение кадрового учета."}
      />
      <TextField
        label="Период обработки"
        fullWidth
        required
        multiline
        minRows={3}
        {...register("processingPeriod")}
        error={Boolean(errors.processingPeriod)}
        helperText={errors.processingPeriod?.message ?? "Укажите срок обработки и хранения данных по этой цели."}
      />
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
