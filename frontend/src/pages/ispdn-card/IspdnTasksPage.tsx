import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Alert, Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink, useParams } from "react-router-dom";

import { getActualTasksByIspdnId } from "../../entities/task/api/taskEventsApi";
import type { ActualTask } from "../../entities/task/model/types";
import { formatTaskImportance } from "../../features/tasks/TaskImportanceSelect";
import { formatDateOnly } from "../../features/tasks/TaskList";
import { taskStatusLabels } from "../../features/tasks/TaskStatusSelect";

export function IspdnTasksPage() {
  const { ispdnId } = useParams();
  const numericId = Number(ispdnId);
  const isValidId = Number.isInteger(numericId) && numericId > 0;

  const actualTasksQuery = useQuery({
    queryKey: ["actualTasks", numericId],
    queryFn: () => getActualTasksByIspdnId(numericId),
    enabled: isValidId,
    retry: false,
  });

  if (!isValidId) {
    return <Alert severity="error">Некорректный идентификатор ИСПДн в маршруте.</Alert>;
  }

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
        <Box>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 600 }}>
            Актуальные задачи ИСПДн
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 820 }}>
            Список задач выбранной ИСПДн со статусами «Ожидает выполнения» и «В работе». Управление задачами
            выполняется в общем модуле.
          </Typography>
        </Box>
        <Button
          component={RouterLink}
          to={`/tasks?ispdn_id=${numericId}&actual_only=true`}
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          sx={{ alignSelf: { sm: "flex-start" } }}
        >
          Открыть общий модуль
        </Button>
      </Stack>

      {actualTasksQuery.isLoading && <Alert severity="info">Загрузка актуальных задач...</Alert>}
      {actualTasksQuery.isError && (
        <Alert severity="error">Не удалось загрузить актуальные задачи выбранной ИСПДн.</Alert>
      )}
      {!actualTasksQuery.isLoading && !actualTasksQuery.isError && (actualTasksQuery.data ?? []).length === 0 && (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
          <Typography sx={{ fontWeight: 600 }}>Актуальных задач по этой ИСПДн нет</Typography>
        </Paper>
      )}

      <Stack spacing={2}>
        {(actualTasksQuery.data ?? []).map((task) => (
          <ActualTaskCard key={task.id} task={task} />
        ))}
      </Stack>
    </Stack>
  );
}

function ActualTaskCard({ task }: { task: ActualTask }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
      <Stack spacing={1.5}>
        <Box>
          <Typography component="h2" variant="h6" sx={{ fontWeight: 600 }}>
            {task.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Событие: {task.taskEventTitle}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
          <Chip size="small" label={taskStatusLabels[task.status]} />
          <Chip
            size="small"
            label={formatTaskImportance(task.importance)}
            color={task.importance === "critical" ? "error" : task.importance === "high" ? "warning" : "default"}
          />
          <Chip size="small" label={`Дедлайн: ${task.deadline ? formatDateOnly(task.deadline) : "не указан"}`} />
          <Chip size="small" label={`Ответственный: ${task.responsibleEmployee?.fullName ?? "не назначен"}`} />
        </Stack>
        {task.description && <Typography>{task.description}</Typography>}
      </Stack>
    </Paper>
  );
}
