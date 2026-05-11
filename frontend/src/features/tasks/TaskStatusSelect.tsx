import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";

import type { TaskStatus } from "../../entities/task/model/types";

export const taskStatusLabels: Record<TaskStatus, string> = {
  pending: "Ожидает выполнения",
  in_progress: "В работе",
  done: "Выполнена",
};

type TaskStatusSelectProps = {
  value: TaskStatus | "";
  onChange: (value: TaskStatus | "") => void;
  label?: string;
  includeEmpty?: boolean;
  emptyLabel?: string;
  error?: boolean;
};

export function TaskStatusSelect({
  value,
  onChange,
  label = "Статус",
  includeEmpty = false,
  emptyLabel = "Все статусы",
  error = false,
}: TaskStatusSelectProps) {
  return (
    <FormControl fullWidth size="small" error={error}>
      <InputLabel>{label}</InputLabel>
      <Select
        label={label}
        value={value}
        onChange={(event) => onChange(event.target.value as TaskStatus | "")}
      >
        {includeEmpty && <MenuItem value="">{emptyLabel}</MenuItem>}
        <MenuItem value="pending">{taskStatusLabels.pending}</MenuItem>
        <MenuItem value="in_progress">{taskStatusLabels.in_progress}</MenuItem>
        <MenuItem value="done">{taskStatusLabels.done}</MenuItem>
      </Select>
    </FormControl>
  );
}
