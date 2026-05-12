import AddIcon from "@mui/icons-material/Add";
import { Alert, Box, Button, Paper, Snackbar, Stack, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
  createTask,
  createTaskEvent,
  deleteTask,
  getTaskEvents,
  updateTask,
  updateTaskImportance,
  updateTaskStatus,
} from "../../entities/task/api/taskEventsApi";
import type {
  Task,
  TaskEvent,
  TaskEventCreateFormValues,
  TaskEventFilters,
  TaskFormValues,
  TaskImportance,
  TaskStatus,
} from "../../entities/task/model/types";
import { DeleteTaskConfirmDialog } from "../../features/tasks/DeleteTaskConfirmDialog";
import { TaskEventCard } from "../../features/tasks/TaskEventCard";
import { TaskEventFormDialog } from "../../features/tasks/TaskEventFormDialog";
import { TaskEventsFilters } from "../../features/tasks/TaskEventsFilters";
import { TaskFormDialog } from "../../features/tasks/TaskFormDialog";

type TaskDialogState = {
  mode: "create" | "edit";
  taskEvent: TaskEvent;
  task: Task | null;
};

export function TasksPage() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<TaskEventFilters>(() => ({
    ispdnId: toNumberFilter(searchParams.get("ispdn_id")),
    showCompleted: searchParams.get("actual_only") === "false",
  }));
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [taskDialog, setTaskDialog] = useState<TaskDialogState | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ taskEvent: TaskEvent; task: Task } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const queryFilters = useMemo(() => compactFilters(filters), [filters]);
  const taskEventsQuery = useQuery({
    queryKey: ["taskEvents", queryFilters],
    queryFn: () => getTaskEvents(queryFilters),
  });

  const createEventMutation = useMutation({
    mutationFn: (values: TaskEventCreateFormValues) => createTaskEvent(values),
    onSuccess: async () => {
      await invalidateTaskQueries(queryClient);
      setEventDialogOpen(false);
      setSuccessMessage("Событие создано.");
    },
  });

  const createMutation = useMutation({
    mutationFn: ({ taskEventId, values }: { taskEventId: number; values: TaskFormValues }) =>
      createTask(taskEventId, values),
    onSuccess: async () => {
      await invalidateTaskQueries(queryClient);
      setTaskDialog(null);
      setSuccessMessage("Задача создана.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ taskEventId, taskId, values }: { taskEventId: number; taskId: number; values: TaskFormValues }) =>
      updateTask(taskEventId, taskId, values),
    onSuccess: async () => {
      await invalidateTaskQueries(queryClient);
      setTaskDialog(null);
      setSuccessMessage("Задача обновлена.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ taskEventId, taskId }: { taskEventId: number; taskId: number }) => deleteTask(taskEventId, taskId),
    onSuccess: async () => {
      await invalidateTaskQueries(queryClient);
      setDeleteDialog(null);
      setSuccessMessage("Задача удалена.");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ taskEventId, taskId, status }: { taskEventId: number; taskId: number; status: TaskStatus }) =>
      updateTaskStatus(taskEventId, taskId, status),
    onSuccess: async () => {
      await invalidateTaskQueries(queryClient);
      setSuccessMessage("Статус задачи обновлён.");
    },
  });

  const updateImportanceMutation = useMutation({
    mutationFn: ({
      taskEventId,
      taskId,
      importance,
    }: {
      taskEventId: number;
      taskId: number;
      importance: TaskImportance | null;
    }) => updateTaskImportance(taskEventId, taskId, importance),
    onSuccess: async () => {
      await invalidateTaskQueries(queryClient);
      setSuccessMessage("Важность задачи обновлена.");
    },
  });

  const handleSubmitTaskEvent = (values: TaskEventCreateFormValues) => {
    createEventMutation.mutate(values);
  };

  const handleSubmitTask = (values: TaskFormValues) => {
    if (!taskDialog) {
      return;
    }
    if (taskDialog.mode === "edit" && taskDialog.task) {
      updateMutation.mutate({
        taskEventId: taskDialog.taskEvent.id,
        taskId: taskDialog.task.id,
        values,
      });
      return;
    }
    createMutation.mutate({ taskEventId: taskDialog.taskEvent.id, values });
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
        <Box>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 600 }}>
            Задачи и несоответствия
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 860 }}>
            Глобальный список событий и задач по всем ИСПДн. Используйте фильтры, чтобы оставить задачи конкретной
            ИСПДн, ответственного сотрудника, статуса или важности.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setEventDialogOpen(true)}
          sx={{ alignSelf: { xs: "flex-start", md: "center" } }}
        >
          Создать событие
        </Button>
      </Stack>

      <TaskEventsFilters filters={filters} onChange={setFilters} />

      {taskEventsQuery.isError && (
        <Alert severity="error">Не удалось загрузить события и задачи. Проверьте доступность backend API.</Alert>
      )}
      {(createMutation.isError || updateMutation.isError) && (
        <Alert severity="error">Не удалось сохранить задачу. Проверьте данные и повторите попытку.</Alert>
      )}
      {createEventMutation.isError && (
        <Alert severity="error">Не удалось создать событие. Проверьте данные и повторите попытку.</Alert>
      )}
      {(updateStatusMutation.isError || updateImportanceMutation.isError) && (
        <Alert severity="error">Не удалось быстро обновить задачу. Повторите попытку.</Alert>
      )}
      {deleteMutation.isError && <Alert severity="error">Не удалось удалить задачу.</Alert>}

      {taskEventsQuery.isLoading && <Alert severity="info">Загрузка событий и задач...</Alert>}

      {!taskEventsQuery.isLoading && (taskEventsQuery.data ?? []).length === 0 && (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
          <Typography sx={{ fontWeight: 600 }}>Событий и задач пока нет</Typography>
        </Paper>
      )}

      <Stack spacing={2}>
        {(taskEventsQuery.data ?? []).map((taskEvent) => (
          <TaskEventCard
            key={taskEvent.id}
            taskEvent={taskEvent}
            onAddTask={(event) => setTaskDialog({ mode: "create", taskEvent: event, task: null })}
            onEditTask={(event, task) => setTaskDialog({ mode: "edit", taskEvent: event, task })}
            onDeleteTask={(event, task) => setDeleteDialog({ taskEvent: event, task })}
            onTaskStatusChange={(event, task, status) => {
              if (task.status !== status) {
                updateStatusMutation.mutate({ taskEventId: event.id, taskId: task.id, status });
              }
            }}
            onTaskImportanceChange={(event, task, importance) => {
              if (task.importance !== importance) {
                updateImportanceMutation.mutate({ taskEventId: event.id, taskId: task.id, importance });
              }
            }}
          />
        ))}
      </Stack>

      <TaskEventFormDialog
        open={eventDialogOpen}
        isSubmitting={createEventMutation.isPending}
        onClose={() => setEventDialogOpen(false)}
        onSubmit={handleSubmitTaskEvent}
      />
      <TaskFormDialog
        open={Boolean(taskDialog)}
        task={taskDialog?.task ?? null}
        isSubmitting={isSubmitting}
        onClose={() => setTaskDialog(null)}
        onSubmit={handleSubmitTask}
      />
      <DeleteTaskConfirmDialog
        task={deleteDialog?.task ?? null}
        isDeleting={deleteMutation.isPending}
        onClose={() => setDeleteDialog(null)}
        onConfirm={(task) => {
          if (deleteDialog) {
            deleteMutation.mutate({ taskEventId: deleteDialog.taskEvent.id, taskId: task.id });
          }
        }}
      />
      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
      />
    </Stack>
  );
}

function toNumberFilter(value: string | null) {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric > 0 ? numeric : null;
}

function compactFilters(filters: TaskEventFilters): TaskEventFilters {
  return {
    ispdnId: filters.ispdnId || null,
    taskStatus: filters.taskStatus || null,
    importance: filters.importance || null,
    responsibleEmployeeId: filters.responsibleEmployeeId || null,
    showCompleted: Boolean(filters.showCompleted),
  };
}

async function invalidateTaskQueries(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: ["taskEvents"] });
  await queryClient.invalidateQueries({ queryKey: ["actualTasks"] });
}
