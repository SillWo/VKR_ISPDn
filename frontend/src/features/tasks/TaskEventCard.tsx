import AddIcon from "@mui/icons-material/Add";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Box, Button, Collapse, IconButton, Paper, Stack, Tooltip, Typography } from "@mui/material";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import type { Task, TaskEvent, TaskImportance, TaskStatus } from "../../entities/task/model/types";
import { DateTimeChip } from "../../shared/ui/DateTimeChip";
import { IspdnTag } from "../../shared/ui/IspdnTag";
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
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, bgcolor: "background.paper" }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography component="h2" variant="h6" sx={{ fontWeight: 600 }}>
              {taskEvent.title}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
              <DateTimeChip label={formatDateTime(taskEvent.createdAt)} />
              <IspdnTag id={taskEvent.ispdn?.id} name={taskEvent.ispdn?.name} />
            </Stack>
            {taskEvent.description && <Typography sx={{ mt: 1.5 }}>{taskEvent.description}</Typography>}
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "flex-start" } }}>
            {taskEvent.ispdn && (
              <Button
                component={RouterLink}
                to={`/ispdns/${taskEvent.ispdn.id}`}
                variant="outlined"
                endIcon={<ArrowForwardIcon />}
                sx={{ width: 180, whiteSpace: "nowrap" }}
              >
                Перейти к ИСПДн
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => onAddTask(taskEvent)}
              sx={{ width: 180, whiteSpace: "nowrap" }}
            >
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
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Tooltip title={tasksOpen ? "Свернуть список" : "Развернуть список"}>
            <IconButton
              size="small"
              aria-label={tasksOpen ? "Свернуть список задач" : "Развернуть список задач"}
              onClick={() => setTasksOpen((value) => !value)}
            >
              {tasksOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Tooltip>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
            {taskCount}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}
