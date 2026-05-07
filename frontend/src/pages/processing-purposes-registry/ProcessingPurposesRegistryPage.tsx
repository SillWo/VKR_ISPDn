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
  createProcessingPurpose,
  deleteProcessingPurpose,
  getProcessingPurposes,
  updateProcessingPurpose,
} from "../../entities/processing-purpose/api/processingPurposeApi";
import type {
  ProcessingPurpose,
  ProcessingPurposeFormValues,
} from "../../entities/processing-purpose/model/types";
import { defaultProcessingPurposeFormValues } from "../../features/processing-purpose-form/model/schema";
import { ProcessingPurposeForm } from "../../features/processing-purpose-form/ui/ProcessingPurposeForm";
import { HttpError } from "../../shared/api/httpClient";

export function ProcessingPurposesRegistryPage() {
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; purpose?: ProcessingPurpose } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const purposesQuery = useQuery({ queryKey: ["processingPurposes"], queryFn: getProcessingPurposes });

  const createMutation = useMutation({
    mutationFn: createProcessingPurpose,
    onSuccess: async () => {
      await invalidateProcessingPurposes(queryClient);
      setDialog(null);
      setSuccessMessage("Цель обработки создана.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: ProcessingPurposeFormValues }) =>
      updateProcessingPurpose(id, values),
    onSuccess: async () => {
      await invalidateProcessingPurposes(queryClient);
      setDialog(null);
      setSuccessMessage("Цель обработки обновлена.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProcessingPurpose,
    onSuccess: async () => {
      await invalidateProcessingPurposes(queryClient);
      setSuccessMessage("Цель обработки удалена.");
    },
  });

  const formValues = dialog?.purpose
    ? {
        name: dialog.purpose.name,
        processingPeriod: dialog.purpose.processingPeriod,
      }
    : defaultProcessingPurposeFormValues;

  const handleSubmit = (values: ProcessingPurposeFormValues) => {
    if (dialog?.mode === "edit" && dialog.purpose) {
      updateMutation.mutate({ id: dialog.purpose.id, values });
      return;
    }
    createMutation.mutate(values);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const deleteConflict = deleteMutation.error instanceof HttpError && deleteMutation.error.status === 409;

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
        <Box>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 600 }}>
            Реестр целей обработки
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 760 }}>
            Единый справочник целей обработки ПДн, используемый в процессах обработки конкретных ИСПДн.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialog({ mode: "create" })}
          sx={{ alignSelf: { sm: "flex-start" } }}
        >
          Добавить цель обработки
        </Button>
      </Stack>

      {purposesQuery.isError && (
        <Alert severity="error">Не удалось загрузить цели обработки. Проверьте доступность backend API.</Alert>
      )}
      {(createMutation.isError || updateMutation.isError) && (
        <Alert severity="error">Не удалось сохранить цель обработки. Проверьте данные и уникальность названия.</Alert>
      )}
      {deleteMutation.isError && (
        <Alert severity="error">
          {deleteConflict
            ? "Цель используется в процессах обработки и не может быть удалена."
            : "Не удалось удалить цель обработки."}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ borderRadius: 2, bgcolor: "background.paper" }}>
        <Box sx={{ p: 2 }}>
          <PurposesTable
            purposes={purposesQuery.data ?? []}
            isLoading={purposesQuery.isLoading}
            onEdit={(purpose) => setDialog({ mode: "edit", purpose })}
            onDelete={(purpose) => {
              if (window.confirm(`Удалить цель обработки "${purpose.name}"?`)) {
                deleteMutation.mutate(purpose.id);
              }
            }}
          />
        </Box>
      </Paper>

      <Dialog open={dialog !== null} onClose={() => setDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle>{dialog?.mode === "edit" ? "Редактировать цель обработки" : "Добавить цель обработки"}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <ProcessingPurposeForm
              key={dialog?.purpose?.id ?? "new-processing-purpose"}
              defaultValues={formValues}
              submitLabel={dialog?.mode === "edit" ? "Сохранить изменения" : "Создать цель"}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              onCancel={() => setDialog(null)}
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

function PurposesTable({
  purposes,
  isLoading,
  onEdit,
  onDelete,
}: {
  purposes: ProcessingPurpose[];
  isLoading: boolean;
  onEdit: (purpose: ProcessingPurpose) => void;
  onDelete: (purpose: ProcessingPurpose) => void;
}) {
  if (isLoading) {
    return <Alert severity="info">Загрузка целей обработки...</Alert>;
  }

  if (purposes.length === 0) {
    return <Alert severity="info">В реестре пока нет целей обработки.</Alert>;
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Название</TableCell>
            <TableCell>Период обработки</TableCell>
            <TableCell align="right">Действия</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {purposes.map((purpose) => (
            <TableRow key={purpose.id} hover>
              <TableCell sx={{ fontWeight: 600 }}>{purpose.name}</TableCell>
              <TableCell>{purpose.processingPeriod}</TableCell>
              <TableCell align="right">
                <Tooltip title="Редактировать">
                  <IconButton aria-label="Редактировать" onClick={() => onEdit(purpose)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Удалить">
                  <IconButton aria-label="Удалить" color="error" onClick={() => onDelete(purpose)}>
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

async function invalidateProcessingPurposes(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: ["processingPurposes"] });
  await queryClient.invalidateQueries({ queryKey: ["processingPurposeOptions"] });
}
