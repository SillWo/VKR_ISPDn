import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import {
  Alert,
  Box,
  Button,
  Chip,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink, useParams } from "react-router-dom";

import { getActualTasksByIspdnId } from "../../entities/task/api/taskEventsApi";
import type { ActualTask } from "../../entities/task/model/types";
import { formatTaskImportance } from "../../features/tasks/TaskImportanceSelect";
import { formatDateOnly } from "../../features/tasks/TaskList";
import { taskStatusLabels } from "../../features/tasks/TaskStatusSelect";
import { getTaskImportanceChipSx, getTaskStatusChipSx } from "../../features/tasks/taskVisuals";

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

      {(actualTasksQuery.data ?? []).length > 0 && <ActualTasksTable tasks={actualTasksQuery.data ?? []} />}
    </Stack>
  );
}

function ActualTasksTable({ tasks }: { tasks: ActualTask[] }) {
  return (
    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, bgcolor: "background.paper" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Задача</TableCell>
            <TableCell sx={{ width: 170 }}>Статус</TableCell>
            <TableCell sx={{ width: 170 }}>Важность</TableCell>
            <TableCell sx={{ width: 150 }}>Дедлайн</TableCell>
            <TableCell sx={{ width: 220 }}>Ответственный</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id} hover>
              <TableCell>
                <Stack spacing={0.75}>
                  <Link
                    component={RouterLink}
                    to={`/tasks?ispdn_id=${task.ispdnId}&task_id=${task.id}`}
                    underline="hover"
                    sx={{ fontWeight: 700, color: "text.primary" }}
                  >
                    {task.title}
                  </Link>
                  <Chip size="small" label={task.taskEventTitle} variant="outlined" sx={{ alignSelf: "flex-start" }} />
                  {task.description && (
                    <Typography variant="body2" color="text.secondary">
                      {task.description}
                    </Typography>
                  )}
                </Stack>
              </TableCell>
              <TableCell>
                <Chip size="small" label={taskStatusLabels[task.status]} sx={getTaskStatusChipSx(task.status)} />
              </TableCell>
              <TableCell>
                <Chip size="small" label={formatTaskImportance(task.importance)} sx={getTaskImportanceChipSx(task.importance)} />
              </TableCell>
              <TableCell>
                <Chip size="small" label={task.deadline ? formatDateOnly(task.deadline) : "Не указан"} variant="outlined" />
              </TableCell>
              <TableCell>
                <Chip size="small" label={task.responsibleEmployee?.fullName ?? "Не назначен"} variant="outlined" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
