import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Stack, TextField } from "@mui/material";
import { useForm } from "react-hook-form";

import type { ControlEventFormValues } from "../../../entities/control-event/model/types";
import { controlEventFormSchema } from "../model/schema";

type ControlEventFormProps = {
  defaultValues: ControlEventFormValues;
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (values: ControlEventFormValues) => void;
  onCancel: () => void;
};

export function ControlEventForm({
  defaultValues,
  submitLabel,
  isSubmitting,
  onSubmit,
  onCancel,
}: ControlEventFormProps) {
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<ControlEventFormValues>({
    resolver: zodResolver(controlEventFormSchema),
    defaultValues,
  });

  return (
    <Stack component="form" spacing={2.5} onSubmit={handleSubmit(onSubmit)} noValidate>
      <TextField
        label="Название контрольного мероприятия"
        fullWidth
        required
        {...register("name")}
        error={Boolean(errors.name)}
        helperText={errors.name?.message}
      />
      <TextField
        label="Описание контрольного мероприятия"
        fullWidth
        required
        multiline
        minRows={4}
        {...register("description")}
        error={Boolean(errors.description)}
        helperText={errors.description?.message}
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
