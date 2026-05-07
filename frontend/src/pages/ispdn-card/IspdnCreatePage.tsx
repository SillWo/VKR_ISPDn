import AddIcon from "@mui/icons-material/Add";
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
  Stack,
  Step,
  StepLabel,
  Stepper,
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
import { useNavigate } from "react-router-dom";

import { createIspdn } from "../../entities/ispdn/api/ispdnApi";
import type { IspdnFormValues } from "../../entities/ispdn/model/types";
import { getProcessingPurposeOptions } from "../../entities/processing-purpose/api/processingPurposeApi";
import type { ProcessingPurposeOption } from "../../entities/processing-purpose/model/types";
import { createIspdnProcessingProcess } from "../../entities/processing-process/api/processingProcessApi";
import {
  dataCategoryCatalog,
  internalNetworkTransferOptions,
  internetTransferOptions,
  processingTypeOptions,
  selectedCatalogLabels,
  subjectCategoryCatalog,
} from "../../entities/processing-process/model/catalogs";
import type { ProcessingProcessFormValues } from "../../entities/processing-process/model/types";
import { defaultIspdnFormValues } from "../../features/ispdn-card-form/model/schema";
import { IspdnCardForm } from "../../features/ispdn-card-form/ui/IspdnCardForm";
import { defaultProcessingProcessFormValues } from "../../features/processing-process-form/model/schema";
import { ProcessingProcessForm } from "../../features/processing-process-form/ui/ProcessingProcessForm";

const steps = ["Основные сведения", "Процессы обработки"];

type LocalProcessingProcess = {
  clientId: number;
  values: ProcessingProcessFormValues;
};

type ProcessDialogState =
  | { mode: "create" }
  | { mode: "edit"; process: LocalProcessingProcess };

export function IspdnCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(0);
  const [cardValues, setCardValues] = useState<IspdnFormValues>(defaultIspdnFormValues);
  const [processes, setProcesses] = useState<LocalProcessingProcess[]>([]);
  const [processDialog, setProcessDialog] = useState<ProcessDialogState | null>(null);
  const [nextProcessId, setNextProcessId] = useState(1);

  const purposesQuery = useQuery({
    queryKey: ["processingPurposeOptions"],
    queryFn: getProcessingPurposeOptions,
    enabled: activeStep === 1,
  });

  const mutation = useMutation({
    mutationFn: async (values: { card: IspdnFormValues; processes: LocalProcessingProcess[] }) => {
      const card = await createIspdn(withProcessPurposes(values.card, values.processes.map((process) => process.values)));
      for (const process of values.processes) {
        await createIspdnProcessingProcess(card.id, process.values);
      }
      return card;
    },
    onSuccess: async (card) => {
      await queryClient.invalidateQueries({ queryKey: ["ispdns"] });
      await queryClient.invalidateQueries({ queryKey: ["ispdnProcessingProcesses", card.id] });
      navigate(`/ispdns/${card.id}`);
    },
  });

  const handleMainInfoSubmit = (values: IspdnFormValues) => {
    setCardValues(values);
    setActiveStep(1);
  };

  const handleProcessSubmit = (values: ProcessingProcessFormValues) => {
    if (processDialog?.mode === "edit") {
      setProcesses((current) =>
        current.map((process) =>
          process.clientId === processDialog.process.clientId ? { ...process, values } : process,
        ),
      );
      setProcessDialog(null);
      return;
    }

    setProcesses((current) => [...current, { clientId: nextProcessId, values }]);
    setNextProcessId((current) => current + 1);
    setProcessDialog(null);
  };

  const handleCreateCard = () => {
    if (processes.length === 0) {
      return;
    }
    mutation.mutate({ card: cardValues, processes });
  };

  const dialogDefaultValues =
    processDialog?.mode === "edit" ? processDialog.process.values : defaultProcessingProcessFormValues;

  return (
    <Stack spacing={3}>
      <Box>
        <Typography component="h1" variant="h5" sx={{ fontWeight: 600 }}>
          Создание карточки ИСПДн
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 760 }}>
          Сначала заполните основные сведения, затем добавьте один или несколько процессов обработки.
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, bgcolor: "background.paper" }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {mutation.isError && (
        <Alert severity="error">
          Не удалось сохранить карточку ИСПДн или процессы обработки. Проверьте заполнение полей и доступность API.
        </Alert>
      )}

      {activeStep === 0 && (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, bgcolor: "background.paper" }}>
          <IspdnCardForm
            defaultValues={cardValues}
            submitLabel="Перейти к процессам обработки"
            isSubmitting={mutation.isPending}
            showProcessingPurposes={false}
            onSubmit={handleMainInfoSubmit}
            onCancel={() => navigate("/ispdns")}
          />
        </Paper>
      )}

      {activeStep === 1 && (
        <Stack spacing={3}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
            <Box>
              <Typography component="h2" variant="h6" sx={{ fontWeight: 600 }}>
                Процессы обработки
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 760 }}>
                Добавьте процессы обработки так же, как в модуле процессов внутри карточки ИСПДн. Для создания карточки
                нужен минимум один процесс.
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setProcessDialog({ mode: "create" })}
              disabled={mutation.isPending}
              sx={{ alignSelf: { sm: "flex-start" } }}
            >
              Добавить процесс обработки
            </Button>
          </Stack>

          {processes.length === 0 && (
            <Alert severity="warning">
              Добавьте хотя бы один процесс обработки. Без него карточку ИСПДн создать нельзя.
            </Alert>
          )}

          <Paper variant="outlined" sx={{ borderRadius: 2, bgcolor: "background.paper" }}>
            <Box sx={{ p: 2 }}>
              <LocalProcessingProcessesTable
                processes={processes}
                purposes={purposesQuery.data ?? []}
                isLoadingPurposes={purposesQuery.isLoading}
                onEdit={(process) => setProcessDialog({ mode: "edit", process })}
                onDelete={(process) =>
                  setProcesses((current) => current.filter((item) => item.clientId !== process.clientId))
                }
              />
            </Box>
          </Paper>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "flex-end" }}>
            <Button variant="outlined" onClick={() => setActiveStep(0)} disabled={mutation.isPending}>
              Назад
            </Button>
            <Button variant="contained" onClick={handleCreateCard} disabled={mutation.isPending || processes.length === 0}>
              {mutation.isPending ? "Сохранение..." : "Создать ИСПДн"}
            </Button>
          </Stack>
        </Stack>
      )}

      <Dialog open={processDialog !== null} onClose={() => setProcessDialog(null)} fullWidth maxWidth="lg">
        <DialogTitle>
          {processDialog?.mode === "edit" ? "Редактировать процесс обработки" : "Добавить процесс обработки"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <ProcessingProcessForm
              key={processDialog?.mode === "edit" ? processDialog.process.clientId : `new-${nextProcessId}`}
              defaultValues={dialogDefaultValues}
              submitLabel={processDialog?.mode === "edit" ? "Сохранить изменения" : "Создать процесс"}
              isSubmitting={mutation.isPending}
              onSubmit={handleProcessSubmit}
              onCancel={() => setProcessDialog(null)}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </Stack>
  );
}

function LocalProcessingProcessesTable({
  processes,
  purposes,
  isLoadingPurposes,
  onEdit,
  onDelete,
}: {
  processes: LocalProcessingProcess[];
  purposes: ProcessingPurposeOption[];
  isLoadingPurposes: boolean;
  onEdit: (process: LocalProcessingProcess) => void;
  onDelete: (process: LocalProcessingProcess) => void;
}) {
  if (processes.length === 0) {
    return <Alert severity="info">Создайте первый процесс обработки для новой ИСПДн.</Alert>;
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
          {processes.map((process) => {
            const purpose = purposes.find((item) => item.id === process.values.processingPurposeId);
            return (
              <TableRow key={process.clientId} hover>
                <TableCell>
                  <Typography sx={{ fontWeight: 600 }}>
                    {purpose?.name ?? (isLoadingPurposes ? "Загрузка цели..." : `Цель #${process.values.processingPurposeId}`)}
                  </Typography>
                  {purpose && (
                    <Typography variant="body2" color="text.secondary">
                      {purpose.processingPeriod}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <ChipList labels={selectedCatalogLabels(subjectCategoryCatalog, process.values.subjectCategories)} />
                </TableCell>
                <TableCell>
                  <ChipList labels={selectedCatalogLabels(dataCategoryCatalog, process.values.dataCategories)} max={4} />
                </TableCell>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography variant="body2">
                      {labelByValue(processingTypeOptions, process.values.processingType)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {labelByValue(internalNetworkTransferOptions, process.values.internalNetworkTransfer)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {labelByValue(internetTransferOptions, process.values.internetTransfer)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Трансграничная передача: {process.values.crossBorderTransfer ? "Да" : "Нет"}
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
            );
          })}
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

function labelByValue<TValue extends string>(
  options: readonly { value: TValue; label: string }[],
  value: TValue | "",
) {
  if (value === "") {
    return "Не выбрано";
  }
  return options.find((option) => option.value === value)?.label ?? value;
}

function withProcessPurposes(values: IspdnFormValues, processValues: ProcessingProcessFormValues[]) {
  const processingPurposeIds = Array.from(
    new Set([
      ...values.processingPurposeIds,
      ...processValues
        .map((process) => process.processingPurposeId)
        .filter((purposeId): purposeId is number => purposeId !== null),
    ]),
  );

  return {
    ...values,
    processingPurposeIds,
  };
}
