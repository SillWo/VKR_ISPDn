import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useBlocker, useNavigate } from "react-router-dom";

import { createIspdn, deleteIspdn, updateIspdn } from "../../entities/ispdn/api/ispdnApi";
import type { IspdnCard, IspdnFormValues, IspdnSecurityTools } from "../../entities/ispdn/model/types";
import { getProcessingPurposeOptions } from "../../entities/processing-purpose/api/processingPurposeApi";
import type { ProcessingPurposeOption } from "../../entities/processing-purpose/model/types";
import { createIspdnProcessingProcess } from "../../entities/processing-process/api/processingProcessApi";
import type { ProcessingProcessFormValues } from "../../entities/processing-process/model/types";
import { saveIspdnSecurityLevel } from "../../entities/security-level/api/securityLevelApi";
import type { SecurityLevelFormValues } from "../../entities/security-level/model/types";
import { defaultIspdnFormValues } from "../../features/ispdn-card-form/model/schema";
import { IspdnCardForm } from "../../features/ispdn-card-form/ui/IspdnCardForm";
import { defaultProcessingProcessFormValues } from "../../features/processing-process-form/model/schema";
import { ProcessingProcessForm } from "../../features/processing-process-form/ui/ProcessingProcessForm";
import { defaultSecurityLevelFormValues } from "../../features/security-level-form/model/schema";
import { SecurityLevelForm } from "../../features/security-level-form/ui/SecurityLevelForm";

const steps = ["Основные сведения", "Средства защиты внутри ИСПДн", "Информация о субъектах ПДн", "Процессы обработки"];

const securityToolOptions = [
  { key: "dlp", label: "DLP" },
  { key: "siem", label: "SIEM" },
  { key: "antivirus", label: "Антивирусные средства" },
  { key: "ipsIds", label: "IPS/IDS" },
  { key: "firewallUtmNgfw", label: "МЭ, UTM и NGFW" },
  { key: "vulnerabilityScanner", label: "Сканер уязвимостей" },
  { key: "backupSystem", label: "Система резервного копирования" },
  { key: "trustedBoot", label: "Средство доверенной загрузки" },
  { key: "accessControl", label: "Средства разграничения доступа" },
  { key: "physicalSecurity", label: "СКУД, сигнализация" },
] as const;

type LocalProcessingProcess = {
  clientId: number;
  values: ProcessingProcessFormValues;
};

type ProcessDialogState =
  | { mode: "create" }
  | { mode: "edit"; process: LocalProcessingProcess };

function toFormValues(card: IspdnCard): IspdnFormValues {
  return {
    name: card.name,
    shortDescription: card.shortDescription,
    processingPurposes: card.processingPurposes,
    processingPurposeIds: card.processingPurposeIds,
    commissioningDate: card.commissioningDate,
    decommissioningDate: card.decommissioningDate ?? "",
    websiteUrl: card.websiteUrl ?? "",
    responsibleEmployeeId: card.responsibleEmployeeId,
    systemComposition: card.systemComposition,
    securityTools: {
      ...card.securityTools,
      otherSecurityTools: card.securityTools.otherSecurityTools ?? "",
    },
    status: card.status,
  };
}

export function IspdnCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const allowExitRef = useRef(false);
  const blocker = useBlocker(() => !allowExitRef.current);
  const [activeStep, setActiveStep] = useState(0);
  const [card, setCard] = useState<IspdnCard | null>(null);
  const [cardValues, setCardValues] = useState<IspdnFormValues>(defaultIspdnFormValues);
  const [securityLevelValues, setSecurityLevelValues] =
    useState<SecurityLevelFormValues>(defaultSecurityLevelFormValues);
  const [processes, setProcesses] = useState<LocalProcessingProcess[]>([]);
  const [processDialog, setProcessDialog] = useState<ProcessDialogState | null>(null);
  const [nextProcessId, setNextProcessId] = useState(1);
  const [processingStepError, setProcessingStepError] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (allowExitRef.current) {
        return;
      }
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const purposesQuery = useQuery({
    queryKey: ["processingPurposeOptions"],
    queryFn: getProcessingPurposeOptions,
    enabled: activeStep === 3,
  });

  const cardMutation = useMutation({
    mutationFn: (values: IspdnFormValues) => (card ? updateIspdn(card.id, values) : createIspdn(values)),
    onSuccess: async (savedCard) => {
      setCard(savedCard);
      setCardValues(toFormValues(savedCard));
      await queryClient.invalidateQueries({ queryKey: ["ispdns"] });
      await queryClient.invalidateQueries({ queryKey: ["ispdn", savedCard.id] });
      setActiveStep(1);
    },
  });

  const securityToolsMutation = useMutation({
    mutationFn: () => {
      if (!card) {
        throw new Error("Ispdn card must be created before security tools data");
      }
      return updateIspdn(card.id, cardValues);
    },
    onSuccess: async (savedCard) => {
      setCard(savedCard);
      setCardValues(toFormValues(savedCard));
      await queryClient.invalidateQueries({ queryKey: ["ispdns"] });
      await queryClient.invalidateQueries({ queryKey: ["ispdn", savedCard.id] });
      setActiveStep(2);
    },
  });

  const securityLevelMutation = useMutation({
    mutationFn: (values: SecurityLevelFormValues) => {
      if (!card) {
        throw new Error("Ispdn card must be created before security level data");
      }
      return saveIspdnSecurityLevel(card.id, values);
    },
    onSuccess: async (_record, values) => {
      if (!card) {
        return;
      }
      setSecurityLevelValues(values);
      queryClient.removeQueries({ queryKey: ["technicalSecurityMeasures", card.id] });
      await queryClient.invalidateQueries({ queryKey: ["ispdnSecurityLevel", card.id] });
      await queryClient.invalidateQueries({ queryKey: ["technicalSecurityMeasures", card.id] });
      setActiveStep(3);
    },
  });

  const finishMutation = useMutation({
    mutationFn: async () => {
      if (!card) {
        throw new Error("Ispdn card must be created before processing processes");
      }
      if (processes.length === 0) {
        throw new Error("At least one processing process is required");
      }

      const updatedCardValues = withProcessPurposes(cardValues, processes.map((process) => process.values));
      const updatedCard = await updateIspdn(card.id, updatedCardValues);
      for (const process of processes) {
        await createIspdnProcessingProcess(card.id, process.values);
      }
      return updatedCard;
    },
    onSuccess: async (savedCard) => {
      await queryClient.invalidateQueries({ queryKey: ["ispdns"] });
      await queryClient.invalidateQueries({ queryKey: ["ispdn", savedCard.id] });
      await queryClient.invalidateQueries({ queryKey: ["ispdnProcessingProcesses", savedCard.id] });
      allowExitRef.current = true;
      navigate(`/ispdns/${savedCard.id}`);
    },
  });

  const cancelCreationMutation = useMutation({
    mutationFn: async () => {
      if (card) {
        await deleteIspdn(card.id);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["ispdns"] });
      if (card) {
        await queryClient.invalidateQueries({ queryKey: ["ispdn", card.id] });
        await queryClient.invalidateQueries({ queryKey: ["ispdnSecurityLevel", card.id] });
        queryClient.removeQueries({ queryKey: ["technicalSecurityMeasures", card.id] });
        await queryClient.invalidateQueries({ queryKey: ["ispdnProcessingProcesses", card.id] });
      }
      allowExitRef.current = true;
      if (blocker.state === "blocked") {
        blocker.proceed?.();
        return;
      }
      navigate("/ispdns");
    },
  });

  const isBusy =
    cardMutation.isPending ||
    securityToolsMutation.isPending ||
    securityLevelMutation.isPending ||
    finishMutation.isPending ||
    cancelCreationMutation.isPending;
  const dialogDefaultValues =
    processDialog?.mode === "edit" ? processDialog.process.values : defaultProcessingProcessFormValues;

  const handleProcessSubmit = (values: ProcessingProcessFormValues) => {
    setProcessingStepError(false);
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

  const handleFinish = () => {
    if (processes.length === 0) {
      setProcessingStepError(true);
      return;
    }
    setProcessingStepError(false);
    finishMutation.mutate();
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography component="h1" variant="h5" sx={{ fontWeight: 600 }}>
          Создание ИСПДн
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 820 }}>
          Заполните обязательные разделы последовательно. Выйти из процесса через интерфейс можно только после
          завершения раздела «Процессы обработки».
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

      {cardMutation.isError && (
        <Alert severity="error">
          Не удалось сохранить основные сведения ИСПДн. Проверьте обязательные поля и доступность API.
        </Alert>
      )}
      {securityLevelMutation.isError && (
        <Alert severity="error">
          Не удалось сохранить информацию о субъектах ПДн. Проверьте поля, расчёт уровня и формат файла обоснования.
        </Alert>
      )}
      {securityToolsMutation.isError && (
        <Alert severity="error">
          Не удалось сохранить сведения о средствах защиты. Проверьте доступность API и повторите попытку.
        </Alert>
      )}
      {finishMutation.isError && (
        <Alert severity="error">
          Не удалось завершить создание ИСПДн. Проверьте процессы обработки и доступность API.
        </Alert>
      )}
      {cancelCreationMutation.isError && (
        <Alert severity="error">
          Не удалось отменить создание ИСПДн. Проверьте доступность API и повторите попытку.
        </Alert>
      )}

      {activeStep === 0 && (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, bgcolor: "background.paper" }}>
          <IspdnCardForm
            key={card?.updatedAt ?? "new-card"}
            defaultValues={cardValues}
            submitLabel="Далее"
            isSubmitting={isBusy}
            showActions={false}
            showProcessingPurposes
            showSecurityTools={false}
            onSubmit={(values) => cardMutation.mutate(values)}
            onCancel={() => undefined}
          />
        </Paper>
      )}

      {activeStep === 1 && card && (
        <SecurityToolsStep
          values={cardValues.securityTools}
          isBusy={isBusy}
          onChange={(securityTools) => setCardValues((current) => ({ ...current, securityTools }))}
          onSubmit={() => securityToolsMutation.mutate()}
        />
      )}

      {activeStep === 2 && card && (
        <SecurityLevelForm
          key={card.id}
          formId="security-level-create-form"
          ispdnId={card.id}
          defaultValues={securityLevelValues}
          isSubmitting={isBusy}
          showActions={false}
          onSubmit={(values) => securityLevelMutation.mutate(values)}
        />
      )}

      {activeStep === 3 && (
        <Stack spacing={3}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
            <Box>
              <Typography component="h2" variant="h6" sx={{ fontWeight: 600 }}>
                Процессы обработки
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 760 }}>
                Добавьте один или несколько процессов обработки для создаваемой ИСПДн. После нажатия «Далее» процессы
                будут сохранены, а создание ИСПДн будет завершено.
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setProcessDialog({ mode: "create" })}
              disabled={isBusy}
              sx={{ alignSelf: { sm: "flex-start" } }}
            >
              Добавить процесс обработки
            </Button>
          </Stack>

          {(processingStepError || processes.length === 0) && (
            <Alert severity={processingStepError ? "error" : "warning"}>
              Добавьте хотя бы один процесс обработки, чтобы завершить создание ИСПДн.
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
        </Stack>
      )}

      <WizardNavigation
        activeStep={activeStep}
        isBusy={isBusy}
        onBack={() => setActiveStep((current) => Math.max(0, current - 1))}
        onNext={activeStep === 3 ? handleFinish : undefined}
        nextFormId={
          activeStep === 0
            ? "ispdn-card-form"
            : activeStep === 1
              ? "security-tools-create-form"
              : activeStep === 2
                ? "security-level-create-form"
                : undefined
        }
        nextLabel="Далее"
      />

      <Dialog
        open={blocker.state === "blocked"}
        onClose={() => {
          if (!cancelCreationMutation.isPending) {
            blocker.reset?.();
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Создание ИСПДн не завершено</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Завершите разделы «Основные сведения», «Средства защиты внутри ИСПДн», «Информация о субъектах ПДн» и «Процессы обработки», чтобы выйти из процесса создания.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            color="error"
            variant="outlined"
            onClick={() => cancelCreationMutation.mutate()}
            disabled={cancelCreationMutation.isPending}
          >
            {cancelCreationMutation.isPending ? "Отмена..." : "Отменить создание"}
          </Button>
          <Button variant="contained" onClick={() => blocker.reset?.()} disabled={cancelCreationMutation.isPending}>
            Вернуться к созданию
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={processDialog !== null} onClose={() => setProcessDialog(null)} fullWidth maxWidth="lg">
        <DialogTitle>
          {processDialog?.mode === "edit" ? "Редактирование процесса обработки" : "Добавить процесс обработки"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <ProcessingProcessForm
              key={processDialog?.mode === "edit" ? processDialog.process.clientId : `new-${nextProcessId}`}
              defaultValues={dialogDefaultValues}
              submitLabel={processDialog?.mode === "edit" ? "Сохранить изменения" : "Добавить процесс"}
              isSubmitting={isBusy}
              onSubmit={handleProcessSubmit}
              onCancel={() => setProcessDialog(null)}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </Stack>
  );
}

function SecurityToolsStep({
  values,
  isBusy,
  onChange,
  onSubmit,
}: {
  values: IspdnSecurityTools;
  isBusy: boolean;
  onChange: (values: IspdnSecurityTools) => void;
  onSubmit: () => void;
}) {
  return (
    <Paper
      id="security-tools-create-form"
      component="form"
      variant="outlined"
      sx={{ p: 3, borderRadius: 2, bgcolor: "background.paper" }}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <Stack spacing={3}>
        <Box>
          <Typography component="h2" variant="h6" sx={{ fontWeight: 600 }}>
            Средства защиты внутри ИСПДн
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 760 }}>
            Отметьте средства защиты, которые уже используются внутри создаваемой ИСПДн. Этот шаг можно оставить
            незаполненным и перейти дальше.
          </Typography>
        </Box>

        <Stack spacing={1}>
          {securityToolOptions.map((option) => {
            const checked = Boolean(values[option.key]);
            return (
              <Box
                key={option.key}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                  py: 1,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography>{option.label}</Typography>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexShrink: 0 }}>
                  <Typography color={checked ? "text.secondary" : "text.primary"}>Нет</Typography>
                  <Switch
                    checked={checked}
                    disabled={isBusy}
                    onChange={(_, nextChecked) => onChange({ ...values, [option.key]: nextChecked })}
                  />
                  <Typography color={checked ? "text.primary" : "text.secondary"}>Да</Typography>
                </Stack>
              </Box>
            );
          })}
        </Stack>

        <TextField
          label="Иные средства защиты"
          fullWidth
          multiline
          minRows={3}
          value={values.otherSecurityTools ?? ""}
          onChange={(event) => onChange({ ...values, otherSecurityTools: event.target.value })}
          helperText="Введите дополнительные средства защиты через ;."
          disabled={isBusy}
        />
      </Stack>
    </Paper>
  );
}

function WizardNavigation({
  activeStep,
  isBusy,
  nextFormId,
  nextLabel,
  onBack,
  onNext,
}: {
  activeStep: number;
  isBusy: boolean;
  nextFormId?: string;
  nextLabel: string;
  onBack: () => void;
  onNext?: () => void;
}) {
  return (
    <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
      <Button variant="outlined" onClick={onBack} disabled={isBusy || activeStep === 0}>
        Назад
      </Button>
      <Button
        type={nextFormId ? "submit" : "button"}
        form={nextFormId}
        variant="contained"
        onClick={onNext}
        disabled={isBusy}
      >
        {isBusy ? "Сохранение..." : nextLabel}
      </Button>
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
                <TableCell align="right">
                  <Button variant="outlined" size="small" onClick={() => onEdit(process)} sx={{ mr: 1 }}>
                    Подробнее
                  </Button>
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
