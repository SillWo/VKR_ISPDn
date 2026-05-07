import { Alert, Dialog, DialogContent, DialogTitle, Stack } from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";

import { getDepartments } from "../../../entities/department/api/departmentApi";
import { createEmployee } from "../../../entities/employee/api/employeeApi";
import type { Employee, EmployeeFormValues } from "../../../entities/employee/model/types";
import { defaultEmployeeFormValues } from "../../employee-form/model/schema";
import { EmployeeForm } from "../../employee-form/ui/EmployeeForm";

type EmployeeQuickCreateDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (employee: Employee) => void;
};

export function EmployeeQuickCreateDialog({ open, onClose, onCreated }: EmployeeQuickCreateDialogProps) {
  const departmentsQuery = useQuery({
    queryKey: ["departments"],
    queryFn: getDepartments,
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: (employee) => {
      onCreated(employee);
      onClose();
    },
  });

  const handleSubmit = (values: EmployeeFormValues) => {
    createMutation.mutate(values);
  };

  return (
    <Dialog open={open} onClose={createMutation.isPending ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Создать сотрудника</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {departmentsQuery.isError && (
            <Alert severity="error">
              Не удалось загрузить подразделения. Сотрудника можно создать без подразделения.
            </Alert>
          )}
          {createMutation.isError && <Alert severity="error">Не удалось создать сотрудника.</Alert>}
          <EmployeeForm
            defaultValues={defaultEmployeeFormValues}
            departments={departmentsQuery.data ?? []}
            submitLabel="Создать сотрудника"
            isSubmitting={createMutation.isPending}
            onSubmit={handleSubmit}
            onCancel={onClose}
          />
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
