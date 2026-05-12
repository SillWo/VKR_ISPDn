import AddIcon from "@mui/icons-material/Add";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Box, Button, Collapse, Paper, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import type { Task, TaskEvent, TaskImportance, TaskStatus } from "../../entities/task/model/types";
import { formatDateTime, TaskList } from "./TaskList";

type TaskEventCardProps = {
  taskEvent: TaskEvent;
  onAddTask: (taskEvent: TaskEvent) => void;
  onEditTask: (taskEvent: TaskEvent, task: Task) => void;
  onDeleteTask: (taskEvent: TaskEvent, task: Task) => void;
  onTaskStatusChange: (taskEvent: TaskEvent, task: Task, status: TaskStatus) => void;
  onTaskImportanceChange: (taskEvent: TaskEvent, task: Task, importance: TaskImportance | null) => void;
};

export function TaskEventCard({
  taskEvent,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onTaskStatusChange,
  onTaskImportanceChange,
}: TaskEventCardProps) {
  const [tasksOpen, setTasksOpen] = useState(true);
  const taskCount = taskEvent.tasks.length;

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography component="h2" variant="h6" sx={{ fontWeight: 600 }}>
              {taskEvent.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {formatDateTime(taskEvent.createdAt)} · ИСПДн: {taskEvent.ispdn.name}
            </Typography>
            {taskEvent.description && <Typography sx={{ mt: 1 }}>{taskEvent.description}</Typography>}
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "flex-start" } }}>
            <Button
              component={RouterLink}
              to={`/ispdns/${taskEvent.ispdnId}`}
              variant="outlined"
              endIcon={<ArrowForwardIcon />}
            >
              Перейти к ИСПДн
            </Button>
            <Button
              variant="outlined"
              onClick={() => setTasksOpen((value) => !value)}
              endIcon={tasksOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            >
              {tasksOpen ? "Скрыть задачи" : "Показать задачи"} ({taskCount})
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => onAddTask(taskEvent)}>
              Добавить задачу
            </Button>
          </Stack>
        </Stack>
        <Collapse in={tasksOpen} timeout="auto" unmountOnExit={false}>
          <TaskList
            tasks={taskEvent.tasks}
            onEdit={(task) => onEditTask(taskEvent, task)}
            onDelete={(task) => onDeleteTask(taskEvent, task)}
            onStatusChange={(task, status) => onTaskStatusChange(taskEvent, task, status)}
            onImportanceChange={(task, importance) => onTaskImportanceChange(taskEvent, task, importance)}
          />
        </Collapse>
      </Stack>
    </Paper>
  );
}
