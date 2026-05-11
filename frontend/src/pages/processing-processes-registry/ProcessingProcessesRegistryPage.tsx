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
  createProcessingProcess,
  deleteProcessingProcess,
  getProcessingProcessById,
  getProcessingProcesses,
  updateProcessingProcess,
} from "../../entities/processing-process/api/processingProcessApi";
import type {
  ProcessingProcess,
  ProcessingProcessFormValues,
  ProcessingProcessRegistryItem,
} from "../../entities/processing-process/model/types";
import { defaultProcessingProcessFormValues } from "../../features/processing-process-form/model/schema";
import { ProcessingProcessForm } from "../../features/processing-process-form/ui/ProcessingProcessForm";
import { HttpError } from "../../shared/api/httpClient";

type DialogState = { mode: "create" } | { mode: "edit"; process: ProcessingProcess };

export function ProcessingProcessesRegistryPage() {
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const processesQuery = useQuery({ queryKey: ["processingProcesses"], queryFn: getProcessingProcesses });

  const loadProcessMutation = useMutation({
    mutationFn: getProcessingProcessById,
    onSuccess: (process) => setDialog({ mode: "edit", process }),
  });

  const createMutation = useMutation({
    mutationFn: createProcessingProcess,
    onSuccess: async () => {
      await invalidateProcessingProcesses(queryClient);
      setDialog(null);
      setSuccessMessage("Процесс обработки создан.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: ProcessingProcessFormValues }) =>
      updateProcessingProcess(id, values),
    onSuccess: async () => {
      await invalidateProcessingProcesses(queryClient);
      setDialog(null);
      setSuccessMessage("Процесс обработки обновлен.");
    },
    onError: (error) => {
      if (error instanceof HttpError && error.status === 409) {
        setErrorMessage("Процесс используется в ИСПДн. Измените его из карточки конкретной ИСПДн, чтобы не затронуть другие ИСПДн.");
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProcessingProcess,
    onSuccess: async () => {
      await invalidateProcessingProcesses(queryClient);
      setSuccessMessage("Процесс обработки удален.");
    },
    onError: (error) => {
      if (error instanceof HttpError && error.status === 409) {
        setErrorMessage("Связанный с ИСПДн процесс нельзя удалить из глобального реестра.");
      }
    },
  });

  const defaultValues = dialog?.mode === "edit" ? toFormValues(dialog.process) : defaultProcessingProcessFormValues;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (values: ProcessingProcessFormValues) => {
    if (dialog?.mode === "edit") {
      updateMutation.mutate({ id: dialog.process.id, values });
      return;
    }
    createMutation.mutate(values);
  };

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
        <Box>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 600 }}>
            Реестр процессов обработки
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 820 }}>
            Глобальный реестр канонических процессов обработки. Связанные с ИСПДн процессы редактируются из карточки конкретной ИСПДн.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog({ mode: "create" })} sx={{ alignSelf: { sm: "flex-start" } }}>
          Создать процесс обработки
        </Button>
      </Stack>

      {processesQuery.isError && <Alert severity="error">Не удалось загрузить реестр процессов обработки.</Alert>}
      {errorMessage && (
        <Alert severity="error" onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ borderRadius: 2, bgcolor: "background.paper" }}>
        <Box sx={{ p: 2 }}>
          <ProcessesTable
            processes={processesQuery.data ?? []}
            isLoading={processesQuery.isLoading}
            onEdit={(process) => loadProcessMutation.mutate(process.id)}
            onDelete={(process) => {
              if (window.confirm(`Удалить процесс "${process.name}" из глобального реестра?`)) {
                deleteMutation.mutate(process.id);
              }
            }}
          />
        </Box>
      </Paper>

      <Dialog open={dialog !== null} onClose={() => setDialog(null)} fullWidth maxWidth="lg">
        <DialogTitle>
          {dialog?.mode === "edit" ? "Редактировать процесс обработки" : "Создать процесс обработки"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <ProcessingProcessForm
              key={dialog?.mode === "edit" ? dialog.process.id : "new-processing-process"}
              defaultValues={defaultValues}
              submitLabel={dialog?.mode === "edit" ? "Сохранить" : "Создать"}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              onCancel={() => setDialog(null)}
            />
          </Box>
        </DialogContent>
      </Dialog>

      <Snackbar open={Boolean(successMessage)} autoHideDuration={3000} onClose={() => setSuccessMessage(null)} message={successMessage} />
    </Stack>
  );
}

function ProcessesTable({
  processes,
  isLoading,
  onEdit,
  onDelete,
}: {
  processes: ProcessingProcessRegistryItem[];
  isLoading: boolean;
  onEdit: (process: ProcessingProcessRegistryItem) => void;
  onDelete: (process: ProcessingProcessRegistryItem) => void;
}) {
  if (isLoading) {
    return <Alert severity="info">Загрузка процессов обработки...</Alert>;
  }

  if (processes.length === 0) {
    return <Alert severity="info">Создайте первый процесс обработки.</Alert>;
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Наименование процесса</TableCell>
            <TableCell>Цель обработки</TableCell>
            <TableCell>Период обработки</TableCell>
            <TableCell>Связанные ИСПДн</TableCell>
            <TableCell align="right">Действия</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {processes.map((process) => {
            const isLinked = process.linkedIspdnsCount > 0;
            return (
              <TableRow key={process.id} hover>
                <TableCell>
                  <Typography sx={{ fontWeight: 600 }}>{process.name}</Typography>
                </TableCell>
                <TableCell>{process.purposeName}</TableCell>
                <TableCell>{process.processingPeriod}</TableCell>
                <TableCell>
                  <Typography>{process.linkedIspdnsCount}</Typography>
                  {process.linkedIspdns.length > 0 && process.linkedIspdns.length <= 3 && (
                    <Typography variant="body2" color="text.secondary">
                      {process.linkedIspdns.map((item) => item.name).join(", ")}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Tooltip title={isLinked ? "Процесс используется в ИСПДн. Измените его из карточки конкретной ИСПДн, чтобы не затронуть другие ИСПДн." : "Редактировать"}>
                    <span>
                      <IconButton aria-label="Редактировать" onClick={() => onEdit(process)} disabled={isLinked}>
                        <EditIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title={isLinked ? "Связанный процесс нельзя удалить" : "Удалить"}>
                    <span>
                      <IconButton aria-label="Удалить" color="error" onClick={() => onDelete(process)} disabled={isLinked}>
                        <DeleteIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function toFormValues(process: ProcessingProcess): ProcessingProcessFormValues {
  return {
    name: process.name,
    purposeName: process.purposeName,
    processingPeriod: process.processingPeriod,
    subjectCategories: process.subjectCategories,
    dataCategories: process.dataCategories,
    legalBases: process.legalBases,
    personalDataActions: process.personalDataActions,
    processingType: process.processingType,
    internalNetworkTransfer: process.internalNetworkTransfer,
    internetTransfer: process.internetTransfer,
    crossBorderTransfer: process.crossBorderTransfer,
  };
}

async function invalidateProcessingProcesses(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: ["processingProcesses"] });
  await queryClient.invalidateQueries({ queryKey: ["processingProcessOptions"] });
}
