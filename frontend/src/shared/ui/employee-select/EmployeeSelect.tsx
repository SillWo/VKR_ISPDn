import AddIcon from "@mui/icons-material/Add";
import { Alert, Autocomplete, Button, Stack, TextField, Typography } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { getEmployeeOptions } from "../../../entities/employee/api/employeeApi";
import type { Employee, EmployeeOption } from "../../../entities/employee/model/types";
import { EmployeeQuickCreateDialog } from "../../../features/employee-quick-create/ui/EmployeeQuickCreateDialog";

export type EmployeeSelectProps = {
  value: number | null;
  onChange: (employeeId: number | null) => void;
  label: string;
  required?: boolean;
  allowQuickCreate?: boolean;
  quickCreateButtonPlacement?: "below" | "inline";
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
};

export function EmployeeSelect({
  value,
  onChange,
  label,
  required = false,
  allowQuickCreate = false,
  quickCreateButtonPlacement = "below",
  error = false,
  helperText,
  disabled = false,
}: EmployeeSelectProps) {
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const queryClient = useQueryClient();
  const employeesQuery = useQuery({
    queryKey: ["employeeOptions"],
    queryFn: getEmployeeOptions,
  });

  const selectedEmployee = useMemo(
    () => employeesQuery.data?.find((employee) => employee.id === value) ?? null,
    [employeesQuery.data, value],
  );

  const handleCreated = (employee: Employee) => {
    void queryClient.invalidateQueries({ queryKey: ["employees"] });
    void queryClient.invalidateQueries({ queryKey: ["employeeOptions"] });
    onChange(employee.id);
  };

  const quickCreateButton = allowQuickCreate ? (
    <Button
      type="button"
      variant="outlined"
      startIcon={<AddIcon />}
      onClick={() => setQuickCreateOpen(true)}
      disabled={disabled}
      sx={{
        alignSelf: quickCreateButtonPlacement === "inline" ? "flex-start" : "flex-start",
        mt: quickCreateButtonPlacement === "inline" ? 0.5 : 0,
        whiteSpace: "nowrap",
        px: 1.75,
        py: 0.75,
        gap: 0.5,
        borderColor: "primary.main",
        color: "primary.main",
        "& .MuiButton-startIcon": { mr: 0.5 },
      }}
    >
      Создать сотрудника
    </Button>
  ) : null;

  const select = (
    <Autocomplete<EmployeeOption, false, false, false>
      options={employeesQuery.data ?? []}
      value={selectedEmployee}
      loading={employeesQuery.isLoading}
      disabled={disabled}
      fullWidth
      getOptionLabel={(option) => option.fullName}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      onChange={(_, option) => onChange(option?.id ?? null)}
      renderOption={(props, option) => (
        <li {...props} key={option.id}>
          <Stack spacing={0.25}>
            <Typography sx={{ fontWeight: 600 }}>{option.fullName}</Typography>
            <Typography variant="body2" color="text.secondary">
              {option.position}
              {option.departmentName ? `, ${option.departmentName}` : ""}
            </Typography>
          </Stack>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          error={error}
          helperText={helperText}
        />
      )}
    />
  );

  return (
    <Stack spacing={1} sx={{ width: "100%" }}>
      {employeesQuery.isError && <Alert severity="error">Не удалось загрузить список сотрудников.</Alert>}
      {quickCreateButtonPlacement === "inline" && quickCreateButton ? (
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ alignItems: { md: "flex-start" } }}>
          {select}
          {quickCreateButton}
        </Stack>
      ) : (
        select
      )}
      {quickCreateButtonPlacement === "below" && quickCreateButton}
      <EmployeeQuickCreateDialog
        open={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
        onCreated={handleCreated}
      />
    </Stack>
  );
}
