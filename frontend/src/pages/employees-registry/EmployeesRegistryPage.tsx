import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment,
} from "../../entities/department/api/departmentApi";
import type { Department, DepartmentFormValues } from "../../entities/department/model/types";
import { createEmployee, deleteEmployee, getEmployees, updateEmployee } from "../../entities/employee/api/employeeApi";
import type { Employee, EmployeeFormValues } from "../../entities/employee/model/types";
import { defaultDepartmentFormValues } from "../../features/department-form/model/schema";
import { DepartmentForm } from "../../features/department-form/ui/DepartmentForm";
import { defaultEmployeeFormValues } from "../../features/employee-form/model/schema";
import { EmployeeForm } from "../../features/employee-form/ui/EmployeeForm";

type ActiveTab = "employees" | "departments";

export function EmployeesRegistryPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("employees");
  const [employeeDialog, setEmployeeDialog] = useState<{ mode: "create" | "edit"; employee?: Employee } | null>(null);
  const [departmentDialog, setDepartmentDialog] = useState<{
    mode: "create" | "edit";
    department?: Department;
  } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const employeesQuery = useQuery({ queryKey: ["employees"], queryFn: getEmployees });
  const departmentsQuery = useQuery({ queryKey: ["departments"], queryFn: getDepartments });

  const departmentEmployeeCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const employee of employeesQuery.data ?? []) {
      if (employee.departmentId !== null) {
        counts.set(employee.departmentId, (counts.get(employee.departmentId) ?? 0) + 1);
      }
    }
    return counts;
  }, [employeesQuery.data]);

  const createEmployeeMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: async () => {
      await invalidateEmployees(queryClient);
      setEmployeeDialog(null);
      setSuccessMessage("Сотрудник создан.");
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: EmployeeFormValues }) => updateEmployee(id, values),
    onSuccess: async () => {
      await invalidateEmployees(queryClient);
      setEmployeeDialog(null);
      setSuccessMessage("Сотрудник обновлен.");
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: async () => {
      await invalidateEmployees(queryClient);
      setSuccessMessage("Сотрудник удален.");
    },
  });

  const createDepartmentMutation = useMutation({
    mutationFn: createDepartment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["departments"] });
      setDepartmentDialog(null);
      setSuccessMessage("Подразделение создано.");
    },
  });

  const updateDepartmentMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: DepartmentFormValues }) => updateDepartment(id, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["departments"] });
      await invalidateEmployees(queryClient);
      setDepartmentDialog(null);
      setSuccessMessage("Подразделение обновлено.");
    },
  });

  const deleteDepartmentMutation = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["departments"] });
      await invalidateEmployees(queryClient);
      setSuccessMessage("Подразделение удалено. Сотрудники остались без подразделения.");
    },
  });

  const handleEmployeeSubmit = (values: EmployeeFormValues) => {
    if (employeeDialog?.mode === "edit" && employeeDialog.employee) {
      updateEmployeeMutation.mutate({ id: employeeDialog.employee.id, values });
      return;
    }
    createEmployeeMutation.mutate(values);
  };

  const handleDepartmentSubmit = (values: DepartmentFormValues) => {
    if (departmentDialog?.mode === "edit" && departmentDialog.department) {
      updateDepartmentMutation.mutate({ id: departmentDialog.department.id, values });
      return;
    }
    createDepartmentMutation.mutate(values);
  };

  const employeeFormValues = employeeDialog?.employee
    ? {
        fullName: employeeDialog.employee.fullName,
        position: employeeDialog.employee.position,
        documentInitials: employeeDialog.employee.documentInitials,
        departmentId: employeeDialog.employee.departmentId,
      }
    : defaultEmployeeFormValues;

  const departmentFormValues = departmentDialog?.department
    ? { name: departmentDialog.department.name }
    : defaultDepartmentFormValues;

  const isEmployeeSubmitting = createEmployeeMutation.isPending || updateEmployeeMutation.isPending;
  const isDepartmentSubmitting = createDepartmentMutation.isPending || updateDepartmentMutation.isPending;

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
        <Box>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 600 }}>
            Реестр сотрудников
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 760 }}>
            Единый справочник сотрудников и подразделений, используемый в карточках ИСПДн и документах.
          </Typography>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignSelf: { sm: "flex-start" } }}>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setDepartmentDialog({ mode: "create" })}>
            Добавить подразделение
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEmployeeDialog({ mode: "create" })}>
            Добавить сотрудника
          </Button>
        </Stack>
      </Stack>

      {(employeesQuery.isError || departmentsQuery.isError) && (
        <Alert severity="error">
          Не удалось загрузить данные реестра. Проверьте доступность backend API.
        </Alert>
      )}
      {(createEmployeeMutation.isError || updateEmployeeMutation.isError || deleteEmployeeMutation.isError) && (
        <Alert severity="error">Операция с сотрудником не выполнена.</Alert>
      )}
      {(createDepartmentMutation.isError || updateDepartmentMutation.isError || deleteDepartmentMutation.isError) && (
        <Alert severity="error">Операция с подразделением не выполнена.</Alert>
      )}

      <Paper variant="outlined" sx={{ borderRadius: 2, bgcolor: "background.paper" }}>
        <Tabs
          value={activeTab}
          onChange={(_, value: ActiveTab) => setActiveTab(value)}
          sx={{ px: 2, borderBottom: "1px solid", borderColor: "divider" }}
        >
          <Tab value="employees" label="Сотрудники" />
          <Tab value="departments" label="Подразделения" />
        </Tabs>

        <Box sx={{ p: 2 }}>
          {activeTab === "employees" && (
            <EmployeesTable
              employees={employeesQuery.data ?? []}
              isLoading={employeesQuery.isLoading}
              onEdit={(employee) => setEmployeeDialog({ mode: "edit", employee })}
              onDelete={(employee) => {
                if (window.confirm(`Удалить сотрудника "${employee.fullName}"?`)) {
                  deleteEmployeeMutation.mutate(employee.id);
                }
              }}
            />
          )}
          {activeTab === "departments" && (
            <DepartmentsTable
              departments={departmentsQuery.data ?? []}
              employeeCounts={departmentEmployeeCounts}
              isLoading={departmentsQuery.isLoading}
              onEdit={(department) => setDepartmentDialog({ mode: "edit", department })}
              onDelete={(department) => {
                if (
                  window.confirm(
                    `Удалить подразделение "${department.name}"? Сотрудники не будут удалены и останутся без подразделения.`,
                  )
                ) {
                  deleteDepartmentMutation.mutate(department.id);
                }
              }}
            />
          )}
        </Box>
      </Paper>

      <Dialog open={employeeDialog !== null} onClose={() => setEmployeeDialog(null)} fullWidth maxWidth="md">
        <DialogTitle>{employeeDialog?.mode === "edit" ? "Редактировать сотрудника" : "Добавить сотрудника"}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <EmployeeForm
              key={employeeDialog?.employee?.id ?? "new-employee"}
              defaultValues={employeeFormValues}
              departments={departmentsQuery.data ?? []}
              submitLabel={employeeDialog?.mode === "edit" ? "Сохранить изменения" : "Создать сотрудника"}
              isSubmitting={isEmployeeSubmitting}
              onSubmit={handleEmployeeSubmit}
              onCancel={() => setEmployeeDialog(null)}
            />
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={departmentDialog !== null} onClose={() => setDepartmentDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle>
          {departmentDialog?.mode === "edit" ? "Редактировать подразделение" : "Добавить подразделение"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <DepartmentForm
              key={departmentDialog?.department?.id ?? "new-department"}
              defaultValues={departmentFormValues}
              submitLabel={departmentDialog?.mode === "edit" ? "Сохранить изменения" : "Создать подразделение"}
              isSubmitting={isDepartmentSubmitting}
              onSubmit={handleDepartmentSubmit}
              onCancel={() => setDepartmentDialog(null)}
            />
          </Box>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
      />
    </Stack>
  );
}

function EmployeesTable({
  employees,
  isLoading,
  onEdit,
  onDelete,
}: {
  employees: Employee[];
  isLoading: boolean;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}) {
  if (isLoading) {
    return <Alert severity="info">Загрузка сотрудников...</Alert>;
  }

  if (employees.length === 0) {
    return <Alert severity="info">В реестре пока нет сотрудников.</Alert>;
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>ФИО</TableCell>
            <TableCell>Должность</TableCell>
            <TableCell>Инициалы для документов</TableCell>
            <TableCell>Подразделение</TableCell>
            <TableCell align="right">Действия</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {employees.map((employee) => (
            <TableRow key={employee.id} hover>
              <TableCell sx={{ fontWeight: 600 }}>{employee.fullName}</TableCell>
              <TableCell>{employee.position}</TableCell>
              <TableCell>{employee.documentInitials}</TableCell>
              <TableCell>{employee.department?.name ?? "Без подразделения"}</TableCell>
              <TableCell align="right">
                <Tooltip title="Редактировать">
                  <IconButton aria-label="Редактировать" onClick={() => onEdit(employee)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Удалить">
                  <IconButton aria-label="Удалить" color="error" onClick={() => onDelete(employee)}>
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

function DepartmentsTable({
  departments,
  employeeCounts,
  isLoading,
  onEdit,
  onDelete,
}: {
  departments: Department[];
  employeeCounts: Map<number, number>;
  isLoading: boolean;
  onEdit: (department: Department) => void;
  onDelete: (department: Department) => void;
}) {
  if (isLoading) {
    return <Alert severity="info">Загрузка подразделений...</Alert>;
  }

  if (departments.length === 0) {
    return <Alert severity="info">В реестре пока нет подразделений.</Alert>;
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Название</TableCell>
            <TableCell>Количество сотрудников</TableCell>
            <TableCell align="right">Действия</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {departments.map((department) => (
            <TableRow key={department.id} hover>
              <TableCell sx={{ fontWeight: 600 }}>{department.name}</TableCell>
              <TableCell>{employeeCounts.get(department.id) ?? 0}</TableCell>
              <TableCell align="right">
                <Tooltip title="Редактировать">
                  <IconButton aria-label="Редактировать" onClick={() => onEdit(department)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Удалить">
                  <IconButton aria-label="Удалить" color="error" onClick={() => onDelete(department)}>
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

async function invalidateEmployees(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: ["employees"] });
  await queryClient.invalidateQueries({ queryKey: ["employeeOptions"] });
  await queryClient.invalidateQueries({ queryKey: ["ispdns"] });
}
