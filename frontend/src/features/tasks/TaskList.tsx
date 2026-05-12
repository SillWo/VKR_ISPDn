import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  IconButton,
  MenuItem,
  Select,
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

import type { Task, TaskImportance, TaskStatus } from "../../entities/task/model/types";
import { formatTaskImportance } from "./TaskImportanceSelect";
import { taskStatusLabels } from "./TaskStatusSelect";
import { getTaskImportanceControlSx, getTaskStatusControlSx } from "./taskVisuals";

type TaskListProps = {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onImportanceChange: (task: Task, importance: TaskImportance | null) => void;
};

export function TaskList({ tasks, onEdit, onDelete, onStatusChange, onImportanceChange }: TaskListProps) {
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
                <Select
                  size="small"
                  value={task.status}
                  onChange={(event) => onStatusChange(task, event.target.value as TaskStatus)}
                  sx={getTaskStatusControlSx(task.status)}
                >
                  <MenuItem value="pending">{taskStatusLabels.pending}</MenuItem>
                  <MenuItem value="in_progress">{taskStatusLabels.in_progress}</MenuItem>
                  <MenuItem value="done">{taskStatusLabels.done}</MenuItem>
                </Select>
              </TableCell>
              <TableCell>
                <Select
                  size="small"
                  value={task.importance ?? ""}
                  onChange={(event) =>
                    onImportanceChange(task, (event.target.value || null) as TaskImportance | null)
                  }
                  displayEmpty
                  sx={getTaskImportanceControlSx(task.importance)}
                >
                  <MenuItem value="">{formatTaskImportance(null)}</MenuItem>
                  <MenuItem value="low">{formatTaskImportance("low")}</MenuItem>
                  <MenuItem value="medium">{formatTaskImportance("medium")}</MenuItem>
                  <MenuItem value="high">{formatTaskImportance("high")}</MenuItem>
                  <MenuItem value="critical">{formatTaskImportance("critical")}</MenuItem>
                </Select>
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
