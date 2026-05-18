import type { SxProps, Theme } from "@mui/material/styles";

import type { TaskImportance, TaskStatus } from "../../entities/task/model/types";

type TaskVisual = {
  backgroundColor: string;
  color: string;
  borderColor: string;
};

const taskStatusVisuals: Record<TaskStatus, TaskVisual> = {
  pending: {
    backgroundColor: "rgba(126, 167, 233, 0.16)",
    color: "#315f9f",
    borderColor: "rgba(126, 167, 233, 0.48)",
  },
  in_progress: {
    backgroundColor: "rgba(184, 107, 0, 0.12)",
    color: "#b86b00",
    borderColor: "rgba(184, 107, 0, 0.36)",
  },
  done: {
    backgroundColor: "rgba(68, 180, 139, 0.12)",
    color: "#167e6c",
    borderColor: "rgba(68, 180, 139, 0.36)",
  },
};

const taskImportanceVisuals: Record<TaskImportance | "none", TaskVisual> = {
  none: {
    backgroundColor: "#f6f6f8",
    color: "#7c7f88",
    borderColor: "#e3e4e8",
  },
  low: {
    backgroundColor: "rgba(68, 180, 139, 0.12)",
    color: "#167e6c",
    borderColor: "rgba(68, 180, 139, 0.32)",
  },
  medium: {
    backgroundColor: "rgba(184, 107, 0, 0.12)",
    color: "#b86b00",
    borderColor: "rgba(184, 107, 0, 0.36)",
  },
  high: {
    backgroundColor: "rgba(209, 67, 67, 0.12)",
    color: "#d14343",
    borderColor: "rgba(209, 67, 67, 0.36)",
  },
  critical: {
    backgroundColor: "rgba(111, 66, 193, 0.14)",
    color: "#5b2bbf",
    borderColor: "rgba(111, 66, 193, 0.42)",
  },
};

export function getTaskStatusControlSx(status: TaskStatus): SxProps<Theme> {
  return buildControlSx(taskStatusVisuals[status]);
}

export function getTaskImportanceControlSx(importance: TaskImportance | null): SxProps<Theme> {
  return buildControlSx(taskImportanceVisuals[importance ?? "none"]);
}

export function getTaskStatusChipSx(status: TaskStatus): SxProps<Theme> {
  return buildChipSx(taskStatusVisuals[status]);
}

export function getTaskImportanceChipSx(importance: TaskImportance | null): SxProps<Theme> {
  return buildChipSx(taskImportanceVisuals[importance ?? "none"]);
}

function buildControlSx(visual: TaskVisual): SxProps<Theme> {
  return {
    minWidth: 152,
    "& .MuiSelect-select": {
      py: 0.5,
      fontSize: 13,
      fontWeight: 500,
      color: visual.color,
      backgroundColor: visual.backgroundColor,
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: visual.borderColor,
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: visual.borderColor,
    },
  };
}

function buildChipSx(visual: TaskVisual): SxProps<Theme> {
  return {
    color: visual.color,
    backgroundColor: visual.backgroundColor,
    border: "1px solid",
    borderColor: visual.borderColor,
    fontWeight: 600,
  };
}
