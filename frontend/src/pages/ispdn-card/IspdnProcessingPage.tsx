import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  Alert,
  Box,
  Button,
  Chip,
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
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";

import {
  createIspdnProcessingProcess,
  deleteIspdnProcessingProcess,
  getIspdnProcessingProcesses,
  updateIspdnProcessingProcess,
} from "../../entities/processing-process/api/processingProcessApi";
import {
  dataCategoryCatalog,
  internalNetworkTransferOptions,
  internetTransferOptions,
  legalBasisCatalog,
  mergeDataCategoryValues,
  mergePersonalDataActionValues,
  mergeSwitchValues,
  personalDataActionCatalog,
  processingTypeOptions,
  selectedCatalogLabels,
  subjectCategoryCatalog,
} from "../../entities/processing-process/model/catalogs";
import type {
  ProcessingProcess,
  ProcessingProcessFormValues,
} from "../../entities/processing-process/model/types";
import { defaultProcessingProcessFormValues } from "../../features/processing-process-form/model/schema";
import { ProcessingProcessForm } from "../../features/processing-process-form/ui/ProcessingProcessForm";
import { HttpError } from "../../shared/api/httpClient";

export function IspdnProcessingPage() {
  const { ispdnId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const numericId = Number(ispdnId);
  const isValidId = Number.isInteger(numericId) && numericId > 0;
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; process?: ProcessingProcess } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const processesQuery = useQuery({
    queryKey: ["ispdnProcessingProcesses", numericId],
    queryFn: () => getIspdnProcessingProcesses(numericId),
    enabled: isValidId,
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: (values: ProcessingProcessFormValues) => createIspdnProcessingProcess(numericId, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["ispdnProcessingProcesses", numericId] });
      setDialog(null);
      setSuccessMessage("Процесс обработки создан.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ processId, values }: { processId: number; values: ProcessingProcessFormValues }) =>
      updateIspdnProcessingProcess(numericId, processId, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["ispdnProcessingProcesses", numericId] });
      setDialog(null);
      setSuccessMessage("Процесс обработки обновлен.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (processId: number) => deleteIspdnProcessingProcess(numericId, processId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["ispdnProcessingProcesses", numericId] });
      setSuccessMessage("Процесс обработки удален.");
    },
  });

  if (!isValidId) {
    return <Alert severity="error">Некорректный идентификатор ИСПДн в маршруте.</Alert>;
  }

  const formValues = dialog?.process ? toFormValues(dialog.process) : defaultProcessingProcessFormValues;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isNotFound = processesQuery.error instanceof HttpError && processesQuery.error.status === 404;

  const handleSubmit = (values: ProcessingProcessFormValues) => {
    if (dialog?.mode === "edit" && dialog.process) {
      updateMutation.mutate({ processId: dialog.process.id, values });
      return;
    }
    createMutation.mutate(values);
  };

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
        <Box>
          <Button
            component={RouterLink}
            to={`/ispdns/${numericId}`}
            startIcon={<ArrowBackIcon />}
            variant="text"
            sx={{ mb: 1 }}
          >
            Назад к карточке ИСПДн
          </Button>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 600 }}>
            Процессы обработки
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 820 }}>
            Процессы обработки выбранной ИСПДн. Каждый процесс связан с целью обработки из единого реестра.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialog({ mode: "create" })}
          sx={{ alignSelf: { sm: "flex-start" } }}
        >
          Добавить процесс обработки
        </Button>
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
      {(createMutation.isError || updateMutation.isError) && (
        <Alert severity="error">Не удалось сохранить процесс обработки. Проверьте обязательные поля.</Alert>
      )}
      {deleteMutation.isError && <Alert severity="error">Не удалось удалить процесс обработки.</Alert>}

      {processesQuery.data?.length === 0 && (
        <Alert severity="warning">
          У этой ИСПДн нет ни одного процесса обработки. Модуль процессов обработки считается незаполненным.
        </Alert>
      )}

      <Paper variant="outlined" sx={{ borderRadius: 2, bgcolor: "background.paper" }}>
        <Box sx={{ p: 2 }}>
          <ProcessingProcessesTable
            processes={processesQuery.data ?? []}
            isLoading={processesQuery.isLoading}
            onEdit={(process) => setDialog({ mode: "edit", process })}
            onDelete={(process) => {
              const isLast = (processesQuery.data?.length ?? 0) === 1;
              const warning = isLast
                ? "После удаления у ИСПДн не останется процессов обработки, модуль будет незаполненным. "
                : "";
              if (window.confirm(`${warning}Удалить процесс "${process.processingPurpose.name}"?`)) {
                deleteMutation.mutate(process.id);
              }
            }}
          />
        </Box>
      </Paper>

      <Dialog open={dialog !== null} onClose={() => setDialog(null)} fullWidth maxWidth="lg">
        <DialogTitle>
          {dialog?.mode === "edit" ? "Редактировать процесс обработки" : "Добавить процесс обработки"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <ProcessingProcessForm
              key={dialog?.process?.id ?? "new-processing-process"}
              defaultValues={formValues}
              submitLabel={dialog?.mode === "edit" ? "Сохранить изменения" : "Создать процесс"}
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
    return <Alert severity="info">Создайте первый процесс обработки для выбранной ИСПДн.</Alert>;
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Цель обработки</TableCell>
            <TableCell>Категории субъектов</TableCell>
            <TableCell>Категории данных</TableCell>
            <TableCell>Способы обработки</TableCell>
            <TableCell align="right">Действия</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {processes.map((process) => (
            <TableRow key={process.id} hover>
              <TableCell>
                <Typography sx={{ fontWeight: 600 }}>{process.processingPurpose.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {process.processingPurpose.processingPeriod}
                </Typography>
              </TableCell>
              <TableCell>
                <ChipList labels={selectedCatalogLabels(subjectCategoryCatalog, process.subjectCategories)} />
              </TableCell>
              <TableCell>
                <ChipList labels={selectedCatalogLabels(dataCategoryCatalog, process.dataCategories)} max={4} />
              </TableCell>
              <TableCell>
                <Stack spacing={0.5}>
                  <Typography variant="body2">{labelByValue(processingTypeOptions, process.processingType)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {labelByValue(internalNetworkTransferOptions, process.internalNetworkTransfer)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {labelByValue(internetTransferOptions, process.internetTransfer)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Трансграничная передача: {process.crossBorderTransfer ? "Да" : "Нет"}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell align="right">
                <Tooltip title="Редактировать">
                  <IconButton aria-label="Редактировать" onClick={() => onEdit(process)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Удалить">
                  <IconButton aria-label="Удалить" color="error" onClick={() => onDelete(process)}>
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

function ChipList({ labels, max = 3 }: { labels: string[]; max?: number }) {
  const visibleLabels = labels.slice(0, max);
  const hiddenCount = labels.length - visibleLabels.length;

  return (
    <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", gap: 0.75 }}>
      {visibleLabels.map((label) => (
        <Chip key={label} label={label} size="small" variant="outlined" />
      ))}
      {hiddenCount > 0 && <Chip label={`+${hiddenCount}`} size="small" />}
    </Stack>
  );
}

function labelByValue<TValue extends string>(options: readonly { value: TValue; label: string }[], value: TValue) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function toFormValues(process: ProcessingProcess): ProcessingProcessFormValues {
  return {
    processingPurposeId: process.processingPurposeId,
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
