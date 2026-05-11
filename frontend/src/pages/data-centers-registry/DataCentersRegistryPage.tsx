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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import {
  createDataCenter,
  deleteDataCenter,
  getDataCenterById,
  getDataCenters,
  toDataCenterFormValues,
  updateDataCenter,
} from "../../entities/data-center/api/dataCenterApi";
import type { DataCenterFormValues, DataCenterListItem } from "../../entities/data-center/model/types";
import { defaultDataCenterFormValues } from "../../features/data-center-form/model/schema";
import { DataCenterForm } from "../../features/data-center-form/ui/DataCenterForm";
import { HttpError } from "../../shared/api/httpClient";

type DialogState =
  | { mode: "create" }
  | { mode: "edit"; dataCenterId: number };

export function DataCentersRegistryPage() {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const dataCentersQuery = useQuery({ queryKey: ["dataCenters"], queryFn: getDataCenters });
  const editQuery = useQuery({
    queryKey: ["dataCenter", dialog?.mode === "edit" ? dialog.dataCenterId : null],
    queryFn: () => getDataCenterById(dialog?.mode === "edit" ? dialog.dataCenterId : 0),
    enabled: dialog?.mode === "edit",
  });

  const createMutation = useMutation({
    mutationFn: createDataCenter,
    onSuccess: async () => {
      await invalidateDataCenters(queryClient);
      setDialog(null);
      setSuccessMessage("ЦОД создан.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: DataCenterFormValues }) => updateDataCenter(id, values),
    onSuccess: async () => {
      await invalidateDataCenters(queryClient);
      setDialog(null);
      setSuccessMessage("ЦОД обновлён.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDataCenter,
    onSuccess: async () => {
      await invalidateDataCenters(queryClient);
      setSuccessMessage("ЦОД удалён.");
    },
  });

  const formValues =
    dialog?.mode === "edit" && editQuery.data ? toDataCenterFormValues(editQuery.data) : defaultDataCenterFormValues;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const deleteConflict = deleteMutation.error instanceof HttpError && deleteMutation.error.status === 409;

  const handleSubmit = (values: DataCenterFormValues) => {
    if (dialog?.mode === "edit") {
      updateMutation.mutate({ id: dialog.dataCenterId, values });
      return;
    }
    createMutation.mutate(values);
  };

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
        <Box>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 600 }}>
            Реестр ЦОД
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 820 }}>
            Глобальный справочник центров обработки данных, которые можно связать с одной или несколькими ИСПДн.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialog({ mode: "create" })}
          sx={{ alignSelf: { sm: "flex-start" } }}
        >
          Создать ЦОД
        </Button>
      </Stack>

      {dataCentersQuery.isError && <Alert severity="error">Не удалось загрузить реестр ЦОД.</Alert>}
      {(createMutation.isError || updateMutation.isError) && (
        <Alert severity="error">Не удалось сохранить ЦОД. Проверьте обязательные поля.</Alert>
      )}
      {deleteMutation.isError && (
        <Alert severity="error">
          {deleteConflict
            ? "Нельзя удалить ЦОД, потому что он связан с одной или несколькими ИСПДн."
            : "Не удалось удалить ЦОД."}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ borderRadius: 2, bgcolor: "background.paper" }}>
        <Box sx={{ p: 2 }}>
          <DataCentersTable
            dataCenters={dataCentersQuery.data ?? []}
            isLoading={dataCentersQuery.isLoading}
            onEdit={(dataCenter) => setDialog({ mode: "edit", dataCenterId: dataCenter.id })}
            onDelete={(dataCenter) => {
              if (window.confirm(`Вы точно хотите удалить ЦОД «${dataCenter.name}»?`)) {
                deleteMutation.mutate(dataCenter.id);
              }
            }}
          />
        </Box>
      </Paper>

      <Dialog open={dialog !== null} onClose={() => setDialog(null)} fullWidth maxWidth="md">
        <DialogTitle>{dialog?.mode === "edit" ? "Редактировать ЦОД" : "Создать ЦОД"}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {dialog?.mode === "edit" && editQuery.isLoading && <Alert severity="info">Загрузка ЦОД...</Alert>}
            {dialog?.mode === "edit" && editQuery.isError && (
              <Alert severity="error">Не удалось загрузить ЦОД для редактирования.</Alert>
            )}
            {(dialog?.mode === "create" || editQuery.data) && (
              <DataCenterForm
                key={dialog?.mode === "edit" ? dialog.dataCenterId : "new-data-center"}
                defaultValues={formValues}
                submitLabel={dialog?.mode === "edit" ? "Сохранить изменения" : "Создать ЦОД"}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
                onCancel={() => setDialog(null)}
              />
            )}
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

function DataCentersTable({
  dataCenters,
  isLoading,
  onEdit,
  onDelete,
}: {
  dataCenters: DataCenterListItem[];
  isLoading: boolean;
  onEdit: (dataCenter: DataCenterListItem) => void;
  onDelete: (dataCenter: DataCenterListItem) => void;
}) {
  if (isLoading) {
    return <Alert severity="info">Загрузка ЦОД...</Alert>;
  }

  if (dataCenters.length === 0) {
    return <Alert severity="info">ЦОД пока не добавлены</Alert>;
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Название</TableCell>
            <TableCell>Страна расположения</TableCell>
            <TableCell>Адрес местонахождения</TableCell>
            <TableCell>Собственный ЦОД</TableCell>
            <TableCell>Владелец / ответственная организация</TableCell>
            <TableCell align="right">Действия</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {dataCenters.map((dataCenter) => (
            <TableRow key={dataCenter.id} hover>
              <TableCell sx={{ fontWeight: 600 }}>{dataCenter.name}</TableCell>
              <TableCell>{dataCenter.locationCountry}</TableCell>
              <TableCell>{dataCenter.locationAddress}</TableCell>
              <TableCell>{dataCenter.isOwnDataCenter ? "Да" : "Нет"}</TableCell>
              <TableCell>{dataCenter.ownerDisplayName}</TableCell>
              <TableCell align="right">
                <Tooltip title="Редактировать">
                  <IconButton aria-label="Редактировать" onClick={() => onEdit(dataCenter)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Удалить">
                  <IconButton aria-label="Удалить" color="error" onClick={() => onDelete(dataCenter)}>
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

async function invalidateDataCenters(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: ["dataCenters"] });
  await queryClient.invalidateQueries({ queryKey: ["dataCenterOptions"] });
}
