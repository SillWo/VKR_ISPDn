import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormHelperText,
  Stack,
  TextField,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import type { Task, TaskFormValues } from "../../entities/task/model/types";
import { EmployeeSelect } from "../../shared/ui/employee-select/EmployeeSelect";
import { TaskImportanceSelect } from "./TaskImportanceSelect";
import { TaskStatusSelect } from "./TaskStatusSelect";

const taskFormSchema = z.object({
  title: z.string().trim().min(1, "Укажите название задачи.").max(255, "Не более 255 символов."),
  description: z.string().nullable(),
  importance: z.enum(["low", "medium", "high", "critical"]).nullable(),
  deadline: z.string().nullable(),
  responsibleEmployeeId: z.number().nullable(),
  status: z.enum(["pending", "in_progress", "done"]),
});

const defaultTaskFormValues: TaskFormValues = {
  title: "",
  description: null,
  importance: null,
  deadline: null,
  responsibleEmployeeId: null,
  status: "pending",
};

type TaskFormDialogProps = {
  open: boolean;
  task: Task | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => void;
};

export function TaskFormDialog({ open, task, isSubmitting = false, onClose, onSubmit }: TaskFormDialogProps) {
  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    values: task ? toFormValues(task) : defaultTaskFormValues,
  });

  const submit = (values: TaskFormValues) => {
    onSubmit({
      ...values,
      title: values.title.trim(),
      description: values.description?.trim() || null,
      deadline: values.deadline || null,
    });
  };

  const handleClose = () => {
    reset(task ? toFormValues(task) : defaultTaskFormValues);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{task ? "Редактировать задачу" : "Добавить задачу"}</DialogTitle>
      <DialogContent>
        <Stack component="form" id="task-form" spacing={2.5} sx={{ pt: 1 }} onSubmit={handleSubmit(submit)} noValidate>
          <TextField
            label="Название задачи"
            fullWidth
            required
            {...register("title")}
            error={Boolean(errors.title)}
            helperText={errors.title?.message}
          />
          <TextField
            label="Описание"
            fullWidth
            multiline
            minRows={3}
            {...register("description")}
            error={Boolean(errors.description)}
            helperText={errors.description?.message}
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <TaskStatusSelect
                  value={field.value}
                  onChange={(value) => value && field.onChange(value)}
                  error={Boolean(errors.status)}
                />
              )}
            />
            <Controller
              name="importance"
              control={control}
              render={({ field }) => (
                <TaskImportanceSelect
                  value={field.value ?? ""}
                  onChange={(value) => field.onChange(value || null)}
                  includeEmpty
                  emptyLabel="Без важности"
                  error={Boolean(errors.importance)}
                />
              )}
            />
          </Stack>
          <Controller
            name="deadline"
            control={control}
            render={({ field }) => (
              <TextField
                label="Дедлайн"
                type="date"
                fullWidth
                value={field.value ?? ""}
                onChange={(event) => field.onChange(event.target.value || null)}
                slotProps={{ inputLabel: { shrink: true } }}
                error={Boolean(errors.deadline)}
                helperText={errors.deadline?.message}
              />
            )}
          />
          <Controller
            name="responsibleEmployeeId"
            control={control}
            render={({ field }) => (
              <EmployeeSelect
                label="Ответственный сотрудник"
                value={field.value}
                onChange={field.onChange}
                allowQuickCreate
                error={Boolean(errors.responsibleEmployeeId)}
              />
            )}
          />
          {errors.responsibleEmployeeId?.message && (
            <FormHelperText error>{errors.responsibleEmployeeId.message}</FormHelperText>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={handleClose} disabled={isSubmitting}>
          Отмена
        </Button>
        <Button type="submit" form="task-form" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? "Сохранение..." : "Сохранить"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function toFormValues(task: Task): TaskFormValues {
  return {
    title: task.title,
    description: task.description,
    importance: task.importance,
    deadline: task.deadline,
    responsibleEmployeeId: task.responsibleEmployeeId,
    status: task.status,
  };
}
