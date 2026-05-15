import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { getIspdns } from "../../entities/ispdn/api/ispdnApi";
import type { TaskEventCreateFormValues } from "../../entities/task/model/types";

const taskEventFormSchema = z.object({
  ispdnId: z.number().nullable(),
  title: z.string().trim().min(1, "Укажите название события.").max(255, "Не более 255 символов."),
  description: z.string().nullable(),
});

const defaultValues: TaskEventCreateFormValues = {
  ispdnId: null,
  title: "",
  description: null,
};

type TaskEventFormDialogProps = {
  open: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: TaskEventCreateFormValues) => void;
};

export function TaskEventFormDialog({
  open,
  isSubmitting = false,
  onClose,
  onSubmit,
}: TaskEventFormDialogProps) {
  const ispdnsQuery = useQuery({
    queryKey: ["ispdns", "active"],
    queryFn: () => getIspdns({ status: "active" }),
    enabled: open,
  });
  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<TaskEventCreateFormValues>({
    resolver: zodResolver(taskEventFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!open) {
      reset(defaultValues);
    }
  }, [open, reset]);

  const submit = (values: TaskEventCreateFormValues) => {
    onSubmit({
      ispdnId: values.ispdnId,
      title: values.title.trim(),
      description: values.description?.trim() || null,
    });
  };

  const handleClose = () => {
    reset(defaultValues);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Создать событие</DialogTitle>
      <DialogContent>
        <Stack
          component="form"
          id="task-event-form"
          spacing={2.5}
          sx={{ pt: 1 }}
          onSubmit={handleSubmit(submit)}
          noValidate
        >
          {ispdnsQuery.isError && <Alert severity="error">Не удалось загрузить список действующих ИСПДн.</Alert>}
          <Controller
            name="ispdnId"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth size="small" error={Boolean(errors.ispdnId)}>
                <InputLabel>Связанная ИСПДн</InputLabel>
                <Select
                  label="Связанная ИСПДн"
                  value={field.value ?? ""}
                  onChange={(event) => field.onChange(event.target.value ? Number(event.target.value) : null)}
                  disabled={ispdnsQuery.isLoading || isSubmitting}
                >
                  <MenuItem value="">Без привязки к ИСПДн</MenuItem>
                  {(ispdnsQuery.data ?? []).map((ispdn) => (
                    <MenuItem key={ispdn.id} value={ispdn.id}>
                      {ispdn.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.ispdnId?.message && <FormHelperText>{errors.ispdnId.message}</FormHelperText>}
              </FormControl>
            )}
          />
          <TextField
            label="Название события"
            fullWidth
            required
            {...register("title")}
            error={Boolean(errors.title)}
            helperText={errors.title?.message}
            disabled={isSubmitting}
          />
          <TextField
            label="Описание события"
            fullWidth
            multiline
            minRows={3}
            {...register("description")}
            error={Boolean(errors.description)}
            helperText={errors.description?.message}
            disabled={isSubmitting}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={handleClose} disabled={isSubmitting}>
          Отмена
        </Button>
        <Button type="submit" form="task-event-form" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? "Создание..." : "Создать"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
