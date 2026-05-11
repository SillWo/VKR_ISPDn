import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";

import type { TaskImportance } from "../../entities/task/model/types";

export const taskImportanceLabels: Record<TaskImportance, string> = {
  low: "Низкая",
  medium: "Средняя",
  high: "Высокая",
  critical: "Критическая",
};

export function formatTaskImportance(value: TaskImportance | null) {
  return value ? taskImportanceLabels[value] : "Без важности";
}

type TaskImportanceSelectProps = {
  value: TaskImportance | "";
  onChange: (value: TaskImportance | "") => void;
  label?: string;
  includeEmpty?: boolean;
  emptyLabel?: string;
  error?: boolean;
};

export function TaskImportanceSelect({
  value,
  onChange,
  label = "Важность",
  includeEmpty = false,
  emptyLabel = "Любая важность",
  error = false,
}: TaskImportanceSelectProps) {
  return (
    <FormControl fullWidth size="small" error={error}>
      <InputLabel>{label}</InputLabel>
      <Select
        label={label}
        value={value}
        onChange={(event) => onChange(event.target.value as TaskImportance | "")}
      >
        {includeEmpty && <MenuItem value="">{emptyLabel}</MenuItem>}
        <MenuItem value="low">{taskImportanceLabels.low}</MenuItem>
        <MenuItem value="medium">{taskImportanceLabels.medium}</MenuItem>
        <MenuItem value="high">{taskImportanceLabels.high}</MenuItem>
        <MenuItem value="critical">{taskImportanceLabels.critical}</MenuItem>
      </Select>
    </FormControl>
  );
}
