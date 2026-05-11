import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";

import type { Task } from "../../entities/task/model/types";
import { formatTaskImportance } from "./TaskImportanceSelect";
import { taskStatusLabels } from "./TaskStatusSelect";

type TaskListProps = {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
};

export function TaskList({ tasks, onEdit, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        В событии пока нет задач.
      </Typography>
    );
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Задача</TableCell>
            <TableCell>Статус</TableCell>
            <TableCell>Важность</TableCell>
            <TableCell>Дедлайн</TableCell>
            <TableCell>Ответственный</TableCell>
            <TableCell align="right">Действия</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id} hover>
              <TableCell>
                <Stack spacing={0.5}>
                  <Typography sx={{ fontWeight: 600 }}>{task.title}</Typography>
                  {task.description && (
                    <Typography variant="body2" color="text.secondary">
                      {task.description}
                    </Typography>
                  )}
                </Stack>
              </TableCell>
              <TableCell>
                <Chip size="small" label={taskStatusLabels[task.status]} color={task.status === "done" ? "success" : "default"} />
              </TableCell>
              <TableCell>
                <Chip size="small" label={formatTaskImportance(task.importance)} color={task.importance === "critical" ? "error" : task.importance === "high" ? "warning" : "default"} />
              </TableCell>
              <TableCell>{task.deadline ? formatDateOnly(task.deadline) : "Не указан"}</TableCell>
              <TableCell>{task.responsibleEmployee?.fullName ?? "Не назначен"}</TableCell>
              <TableCell align="right">
                <Tooltip title="Редактировать">
                  <IconButton aria-label="Редактировать задачу" onClick={() => onEdit(task)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Удалить">
                  <IconButton aria-label="Удалить задачу" color="error" onClick={() => onDelete(task)}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatDateOnly(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}
