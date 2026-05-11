import {
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";

import { getEmployeeOptions } from "../../entities/employee/api/employeeApi";
import { getIspdns } from "../../entities/ispdn/api/ispdnApi";
import type { TaskEventFilters } from "../../entities/task/model/types";
import { TaskImportanceSelect } from "./TaskImportanceSelect";
import { TaskStatusSelect } from "./TaskStatusSelect";

type TaskEventsFiltersProps = {
  filters: TaskEventFilters;
  onChange: (filters: TaskEventFilters) => void;
};

export function TaskEventsFilters({ filters, onChange }: TaskEventsFiltersProps) {
  const ispdnsQuery = useQuery({ queryKey: ["ispdns"], queryFn: () => getIspdns() });
  const employeesQuery = useQuery({ queryKey: ["employeeOptions"], queryFn: getEmployeeOptions });

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: { md: "center" } }}>
        <FormControl fullWidth size="small">
          <InputLabel>ИСПДн</InputLabel>
          <Select
            label="ИСПДн"
            value={filters.ispdnId ?? ""}
            onChange={(event) =>
              onChange({ ...filters, ispdnId: event.target.value ? Number(event.target.value) : null })
            }
          >
            <MenuItem value="">Все ИСПДн</MenuItem>
            {(ispdnsQuery.data ?? []).map((ispdn) => (
              <MenuItem key={ispdn.id} value={ispdn.id}>
                {ispdn.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TaskStatusSelect
          value={filters.taskStatus ?? ""}
          onChange={(value) => onChange({ ...filters, taskStatus: value || null })}
          includeEmpty
        />
        <TaskImportanceSelect
          value={filters.importance ?? ""}
          onChange={(value) => onChange({ ...filters, importance: value || null })}
          includeEmpty
        />
        <FormControl fullWidth size="small">
          <InputLabel>Ответственный</InputLabel>
          <Select
            label="Ответственный"
            value={filters.responsibleEmployeeId ?? ""}
            onChange={(event) =>
              onChange({
                ...filters,
                responsibleEmployeeId: event.target.value ? Number(event.target.value) : null,
              })
            }
          >
            <MenuItem value="">Все сотрудники</MenuItem>
            {(employeesQuery.data ?? []).map((employee) => (
              <MenuItem key={employee.id} value={employee.id}>
                {employee.fullName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControlLabel
          sx={{ minWidth: 220 }}
          control={
            <Checkbox
              checked={Boolean(filters.actualOnly)}
              onChange={(event) => onChange({ ...filters, actualOnly: event.target.checked })}
            />
          }
          label="Только актуальные задачи"
        />
        <Button
          variant="outlined"
          onClick={() => onChange({ actualOnly: false })}
          sx={{ flex: "0 0 auto" }}
        >
          Сбросить
        </Button>
      </Stack>
    </Paper>
  );
}
