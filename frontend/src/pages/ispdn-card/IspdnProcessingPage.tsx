import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";

import {
  createAndLinkIspdnProcessingProcess,
  getIspdnProcessingProcesses,
  getProcessingProcessOptions,
  linkExistingProcessingProcessToIspdn,
  unlinkIspdnProcessingProcess,
  updateIspdnProcessingProcess,
} from "../../entities/processing-process/api/processingProcessApi";
import {
  legalBasisCatalog,
  mergeDataCategoryValues,
  mergePersonalDataActionValues,
  mergeSwitchValues,
  subjectCategoryCatalog,
} from "../../entities/processing-process/model/catalogs";
import type { ProcessingProcess, ProcessingProcessFormValues } from "../../entities/processing-process/model/types";
import { defaultProcessingProcessFormValues } from "../../features/processing-process-form/model/schema";
import { ProcessingProcessForm } from "../../features/processing-process-form/ui/ProcessingProcessForm";
import { HttpError } from "../../shared/api/httpClient";

type DialogState = { mode: "create" } | { mode: "edit"; process: ProcessingProcess } | { mode: "link" };

export function IspdnProcessingPage() {
  const { ispdnId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const numericId = Number(ispdnId);
  const isValidId = Number.isInteger(numericId) && numericId > 0;
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [selectedExistingProcessId, setSelectedExistingProcessId] = useState<number | "">("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const processesQuery = useQuery({
    queryKey: ["ispdnProcessingProcesses", numericId],
    queryFn: () => getIspdnProcessingProcesses(numericId),
    enabled: isValidId,
    retry: false,
  });

  const optionsQuery = useQuery({
    queryKey: ["processingProcessOptions"],
    queryFn: getProcessingProcessOptions,
    enabled: dialog?.mode === "link",
  });

  const createMutation = useMutation({
    mutationFn: (values: ProcessingProcessFormValues) => createAndLinkIspdnProcessingProcess(numericId, values),
    onSuccess: async () => {
      await invalidateProcessingQueries(queryClient, numericId);
      setDialog(null);
      setSuccessMessage("Процесс обработки создан и связан с ИСПДн.");
    },
  });

  const linkMutation = useMutation({
    mutationFn: (processId: number) => linkExistingProcessingProcessToIspdn(numericId, processId),
    onSuccess: async () => {
      await invalidateProcessingQueries(queryClient, numericId);
      setSelectedExistingProcessId("");
      setDialog(null);
      setSuccessMessage("Процесс обработки связан с ИСПДн.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ processId, values }: { processId: number; values: ProcessingProcessFormValues }) =>
      updateIspdnProcessingProcess(numericId, processId, values),
    onSuccess: async () => {
      await invalidateProcessingQueries(queryClient, numericId);
      setDialog(null);
      setSuccessMessage("Процесс обработки изменен только для этой ИСПДн.");
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: (processId: number) => unlinkIspdnProcessingProcess(numericId, processId),
    onSuccess: async () => {
      await invalidateProcessingQueries(queryClient, numericId);
      setSuccessMessage("Связь процесса с ИСПДн удалена.");
    },
  });

  if (!isValidId) {
    return <Alert severity="error">Некорректный идентификатор ИСПДн в маршруте.</Alert>;
  }

  const formValues = dialog?.mode === "edit" ? toFormValues(dialog.process) : defaultProcessingProcessFormValues;
  const isSubmitting = createMutation.isPending || updateMutation.isPending || linkMutation.isPending;
  const isNotFound = processesQuery.error instanceof HttpError && processesQuery.error.status === 404;

  const handleSubmit = (values: ProcessingProcessFormValues) => {
    if (dialog?.mode === "edit") {
      updateMutation.mutate({ processId: dialog.process.id, values });
      return;
    }
    createMutation.mutate(values);
  };

  const handleLinkExisting = () => {
    if (!selectedExistingProcessId) {
      return;
    }
    linkMutation.mutate(selectedExistingProcessId);
  };

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
        <Box>
          <Button component={RouterLink} to={`/ispdns/${numericId}`} startIcon={<ArrowBackIcon />} variant="text" sx={{ mb: 1 }}>
            Назад к карточке ИСПДн
          </Button>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 600 }}>
            Процессы обработки
          </Typography>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignSelf: { sm: "flex-start" } }}>
          <Button variant="outlined" onClick={() => setDialog({ mode: "link" })}>
            Добавить существующий процесс
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog({ mode: "create" })}>
            Создать новый процесс
          </Button>
        </Stack>
      </Stack>

      {processesQuery.isError && (
        <Alert
          severity={isNotFound ? "warning" : "error"}
          action={
            isNotFound ? (
              <Button color="inherit" size="small" onClick={() => navigate("/ispdns")}>
                В реестр
              </Button>
            ) : undefined
          }
        >
          {isNotFound
            ? "Карточка ИСПДн не найдена."
            : "Не удалось загрузить процессы обработки. Проверьте доступность backend API."}
        </Alert>
      )}
      {(createMutation.isError || updateMutation.isError || linkMutation.isError) && (
        <Alert severity="error">Не удалось сохранить процесс обработки. Проверьте обязательные поля.</Alert>
      )}
      {unlinkMutation.isError && <Alert severity="error">Не удалось удалить связь процесса с ИСПДн.</Alert>}

      {processesQuery.data?.length === 0 && (
        <Alert severity="warning">У этой ИСПДн нет связанных процессов обработки.</Alert>
      )}

      <Paper variant="outlined" sx={{ borderRadius: 2, bgcolor: "background.paper" }}>
        <Box sx={{ p: 2 }}>
          <ProcessingProcessesTable
            processes={processesQuery.data ?? []}
            isLoading={processesQuery.isLoading}
            onEdit={(process) => setDialog({ mode: "edit", process })}
            onDelete={(process) => {
              if (window.confirm(`Удалить связь с процессом "${process.purposeName}"? Глобальная запись останется в реестре.`)) {
                unlinkMutation.mutate(process.id);
              }
            }}
          />
        </Box>
      </Paper>

      <Dialog open={dialog !== null} onClose={() => setDialog(null)} fullWidth maxWidth="lg">
        <DialogTitle>
          {dialog?.mode === "edit"
            ? "Редактировать для этой ИСПДн"
            : dialog?.mode === "link"
              ? "Добавить существующий процесс"
              : "Создать новый процесс"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {dialog?.mode === "link" ? (
              <FormControl fullWidth>
                <InputLabel id="processing-process-link-select-label">Процесс обработки</InputLabel>
                <Select
                  labelId="processing-process-link-select-label"
                  label="Процесс обработки"
                  value={selectedExistingProcessId}
                  onChange={(event) => setSelectedExistingProcessId(Number(event.target.value))}
                  disabled={isSubmitting || optionsQuery.isLoading}
                >
                  {optionsQuery.data?.map((process) => (
                    <MenuItem key={process.id} value={process.id}>
                      {process.purposeName} — {process.processingPeriod}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>Выберите процесс из глобального реестра.</FormHelperText>
              </FormControl>
            ) : (
              <Stack spacing={2}>
                {dialog?.mode === "edit" && (
                  <Alert severity="info">
                    Изменения будут применены только к этой ИСПДн. Если после изменения такой процесс уже есть в реестре, система привяжет его. Если нет - создаст новый процесс обработки.
                  </Alert>
                )}
                <ProcessingProcessForm
                  key={dialog?.mode === "edit" ? dialog.process.id : "new-processing-process"}
                  defaultValues={formValues}
                  submitLabel={dialog?.mode === "edit" ? "Сохранить для этой ИСПДн" : "Создать и связать"}
                  isSubmitting={isSubmitting}
                  onSubmit={handleSubmit}
                  onCancel={() => setDialog(null)}
                />
              </Stack>
            )}
          </Box>
        </DialogContent>
        {dialog?.mode === "link" && (
          <DialogActions>
            <Button variant="outlined" onClick={() => setDialog(null)} disabled={isSubmitting}>
              Отмена
            </Button>
            <Button variant="contained" onClick={handleLinkExisting} disabled={isSubmitting || !selectedExistingProcessId}>
              Связать
            </Button>
          </DialogActions>
        )}
      </Dialog>

      <Snackbar open={Boolean(successMessage)} autoHideDuration={3000} onClose={() => setSuccessMessage(null)} message={successMessage} />
    </Stack>
  );
}

function ProcessingProcessesTable({
  processes,
  isLoading,
  onEdit,
  onDelete,
}: {
  processes: ProcessingProcess[];
  isLoading: boolean;
  onEdit: (process: ProcessingProcess) => void;
  onDelete: (process: ProcessingProcess) => void;
}) {
  if (isLoading) {
    return <Alert severity="info">Загрузка процессов обработки...</Alert>;
  }

  if (processes.length === 0) {
    return <Alert severity="info">Добавьте первый процесс обработки для выбранной ИСПДн.</Alert>;
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Цель обработки</TableCell>
            <TableCell>Период обработки</TableCell>
            <TableCell align="right">Действия</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {processes.map((process) => (
            <TableRow key={process.id} hover>
              <TableCell>
                <Typography sx={{ fontWeight: 600 }}>{process.purposeName}</Typography>
              </TableCell>
              <TableCell>{process.processingPeriod}</TableCell>
              <TableCell align="right">
                <Button variant="outlined" size="small" onClick={() => onEdit(process)} sx={{ mr: 1 }}>
                  Редактировать для этой ИСПДн
                </Button>
                <Tooltip title="Удалить из этой ИСПДн">
                  <IconButton aria-label="Удалить из этой ИСПДн" color="error" onClick={() => onDelete(process)}>
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

function toFormValues(process: ProcessingProcess): ProcessingProcessFormValues {
  return {
    purposeName: process.purposeName,
    processingPeriod: process.processingPeriod,
    subjectCategories: mergeSwitchValues(subjectCategoryCatalog, process.subjectCategories),
    dataCategories: mergeDataCategoryValues(process.dataCategories),
    legalBases: mergeSwitchValues(legalBasisCatalog, process.legalBases),
    personalDataActions: mergePersonalDataActionValues(process.personalDataActions),
    processingType: process.processingType,
    internalNetworkTransfer: process.internalNetworkTransfer,
    internetTransfer: process.internetTransfer,
    crossBorderTransfer: process.crossBorderTransfer,
  };
}

async function invalidateProcessingQueries(queryClient: ReturnType<typeof useQueryClient>, ispdnId: number) {
  await queryClient.invalidateQueries({ queryKey: ["ispdnProcessingProcesses", ispdnId] });
  await queryClient.invalidateQueries({ queryKey: ["processingProcesses"] });
  await queryClient.invalidateQueries({ queryKey: ["processingProcessOptions"] });
}
