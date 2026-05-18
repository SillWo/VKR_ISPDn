import AddIcon from "@mui/icons-material/Add";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Step,
  StepLabel,
  Stepper,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useBlocker, useNavigate } from "react-router-dom";

import { createIspdn, deleteIspdn, updateIspdn } from "../../entities/ispdn/api/ispdnApi";
import type { IspdnCard, IspdnFormValues, IspdnSecurityTools } from "../../entities/ispdn/model/types";
import { updateIspdnDataCenters } from "../../entities/data-center/api/dataCenterApi";
import { updateIspdnCryptography } from "../../entities/crypto-tool/api/cryptoToolApi";
import {
  createAndLinkIspdnProcessingProcess,
  getIspdnProcessingProcesses,
  getProcessingProcessOptions,
  linkExistingProcessingProcessToIspdn,
} from "../../entities/processing-process/api/processingProcessApi";
import { getOrganizationReadiness } from "../../entities/organization/api/organizationApi";
import type {
  ProcessingProcess,
  ProcessingProcessFormValues,
} from "../../entities/processing-process/model/types";
import { saveIspdnSecurityLevel } from "../../entities/security-level/api/securityLevelApi";
import type { SecurityLevelFormValues } from "../../entities/security-level/model/types";
import { defaultIspdnFormValues } from "../../features/ispdn-card-form/model/schema";
import { IspdnCardForm } from "../../features/ispdn-card-form/ui/IspdnCardForm";
import { DataCenterSelect } from "../../features/data-center-select/DataCenterSelect";
import { CryptoToolSelect } from "../../features/crypto-tool-select/CryptoToolSelect";
import { defaultProcessingProcessFormValues } from "../../features/processing-process-form/model/schema";
import { ProcessingProcessForm } from "../../features/processing-process-form/ui/ProcessingProcessForm";
import { defaultSecurityLevelFormValues } from "../../features/security-level-form/model/schema";
import { SecurityLevelForm } from "../../features/security-level-form/ui/SecurityLevelForm";
import { GenerateActIspdnDocumentForm } from "../../features/document-generation/ui/GenerateActIspdnDocumentForm";
import type { GenerateActIspdnDocumentFormHandle } from "../../features/document-generation/ui/GenerateActIspdnDocumentForm";
import { GenerateActSafetyLevelDocumentForm } from "../../features/document-generation/ui/GenerateActSafetyLevelDocumentForm";
import type { GenerateActSafetyLevelDocumentFormHandle } from "../../features/document-generation/ui/GenerateActSafetyLevelDocumentForm";

const steps = [
  "Основные сведения",
  "Средства защиты внутри ИСПДн",
  "Информация о субъектах ПДн",
  "Процессы обработки",
  "Заполнение информации о ЦОД",
  "Использование криптографии",
  "Выпуск документов",
];

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

type ProcessDialogState =
  | { mode: "create" }
  | { mode: "link" };

type DocumentStatus = "not_prepared" | "prepared" | "error";

function toFormValues(card: IspdnCard): IspdnFormValues {
  return {
    name: card.name,
    shortDescription: card.shortDescription,
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
  const actIspdnDocumentRef = useRef<GenerateActIspdnDocumentFormHandle>(null);
  const safetyLevelDocumentRef = useRef<GenerateActSafetyLevelDocumentFormHandle>(null);
  const readinessQuery = useQuery({
    queryKey: ["organization", "readiness"],
    queryFn: getOrganizationReadiness,
    retry: false,
  });
  const canUseWizard = readinessQuery.data?.isReadyForIspdnCreation === true;
  const blocker = useBlocker(() => canUseWizard && !allowExitRef.current);
  const [activeStep, setActiveStep] = useState(0);
  const [cardFormTab, setCardFormTab] = useState(0);
  const [card, setCard] = useState<IspdnCard | null>(null);
  const [cardValues, setCardValues] = useState<IspdnFormValues>(defaultIspdnFormValues);
  const [securityLevelValues, setSecurityLevelValues] =
    useState<SecurityLevelFormValues>(defaultSecurityLevelFormValues);
  const [processDialog, setProcessDialog] = useState<ProcessDialogState | null>(null);
  const [selectedExistingProcessId, setSelectedExistingProcessId] = useState<number | "">("");
  const [processingStepError, setProcessingStepError] = useState(false);
  const [dataCenterIds, setDataCenterIds] = useState<number[]>([]);
  const [usesCryptography, setUsesCryptography] = useState(false);
  const [cryptoToolIds, setCryptoToolIds] = useState<number[]>([]);
  const [cryptographyStepError, setCryptographyStepError] = useState(false);
  const [actIspdnGenerated, setActIspdnGenerated] = useState(false);
  const [safetyLevelActGenerated, setSafetyLevelActGenerated] = useState(false);
  const [documentTab, setDocumentTab] = useState(0);
  const [documentStatuses, setDocumentStatuses] = useState<Record<"actIspdn" | "safetyLevel", DocumentStatus>>({
    actIspdn: "not_prepared",
    safetyLevel: "not_prepared",
  });
  const [documentGenerationError, setDocumentGenerationError] = useState<string | null>(null);
  const [isPreparingDocuments, setIsPreparingDocuments] = useState(false);

  useEffect(() => {
    if (!canUseWizard) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (allowExitRef.current) {
        return;
      }
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [canUseWizard]);

  const linkedProcessesQuery = useQuery({
    queryKey: ["ispdnProcessingProcesses", card?.id],
    queryFn: () => getIspdnProcessingProcesses(card!.id),
    enabled: activeStep === 3 && Boolean(card),
  });

  const processOptionsQuery = useQuery({
    queryKey: ["processingProcessOptions"],
    queryFn: getProcessingProcessOptions,
    enabled: activeStep === 3 || processDialog?.mode === "link",
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

  const createProcessMutation = useMutation({
    mutationFn: (values: ProcessingProcessFormValues) => {
      if (!card) {
        throw new Error("Ispdn card must be created before processing processes");
      }
      return createAndLinkIspdnProcessingProcess(card.id, values);
    },
    onSuccess: async () => {
      if (!card) {
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["processingProcesses"] });
      await queryClient.invalidateQueries({ queryKey: ["processingProcessOptions"] });
      await queryClient.invalidateQueries({ queryKey: ["ispdnProcessingProcesses", card.id] });
      setProcessingStepError(false);
      setProcessDialog(null);
    },
  });

  const linkProcessMutation = useMutation({
    mutationFn: (processId: number) => {
      if (!card) {
        throw new Error("Ispdn card must be created before processing processes");
      }
      return linkExistingProcessingProcessToIspdn(card.id, processId);
    },
    onSuccess: async () => {
      if (!card) {
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["ispdnProcessingProcesses", card.id] });
      setSelectedExistingProcessId("");
      setProcessingStepError(false);
      setProcessDialog(null);
    },
  });

  const dataCentersMutation = useMutation({
    mutationFn: async () => {
      if (!card) {
        throw new Error("Ispdn card must be created before data centers");
      }
      return updateIspdnDataCenters(card.id, dataCenterIds);
    },
    onSuccess: async () => {
      if (!card) {
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["ispdn", card.id] });
      await queryClient.invalidateQueries({ queryKey: ["ispdnDataCenters", card.id] });
      setActiveStep(5);
    },
  });

  const cryptographyMutation = useMutation({
    mutationFn: async () => {
      if (!card) {
        throw new Error("Ispdn card must be created before cryptography data");
      }
      return updateIspdnCryptography(card.id, {
        usesCryptography,
        cryptoToolIds: usesCryptography ? cryptoToolIds : [],
      });
    },
    onSuccess: async () => {
      if (!card) {
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["ispdn", card.id] });
      await queryClient.invalidateQueries({ queryKey: ["ispdnCryptography", card.id] });
      setActiveStep(6);
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
        await queryClient.invalidateQueries({ queryKey: ["ispdnDataCenters", card.id] });
        await queryClient.invalidateQueries({ queryKey: ["ispdnCryptography", card.id] });
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
    createProcessMutation.isPending ||
    linkProcessMutation.isPending ||
    dataCentersMutation.isPending ||
    cryptographyMutation.isPending ||
    isPreparingDocuments ||
    cancelCreationMutation.isPending;
  const dialogDefaultValues = defaultProcessingProcessFormValues;

  const handleProcessSubmit = (values: ProcessingProcessFormValues) => {
    createProcessMutation.mutate(values);
  };

  const handleFinish = () => {
    if ((linkedProcessesQuery.data?.length ?? 0) === 0) {
      setProcessingStepError(true);
      return;
    }
    setProcessingStepError(false);
    setActiveStep(4);
  };

  const handleLinkExistingProcess = () => {
    if (!selectedExistingProcessId) {
      return;
    }
    linkProcessMutation.mutate(selectedExistingProcessId);
  };

  const handleCryptographyFinish = () => {
    if (usesCryptography && cryptoToolIds.length === 0) {
      setCryptographyStepError(true);
      return;
    }
    setCryptographyStepError(false);
    cryptographyMutation.mutate();
  };

  const handlePrepareAllDocuments = async () => {
    if (!actIspdnDocumentRef.current || !safetyLevelDocumentRef.current) {
      return;
    }

    setIsPreparingDocuments(true);
    setDocumentGenerationError(null);

    try {
      await actIspdnDocumentRef.current.generate();
      setActIspdnGenerated(true);
      setDocumentStatuses((current) => ({ ...current, actIspdn: "prepared" }));
    } catch (error) {
      setActIspdnGenerated(false);
      setDocumentStatuses((current) => ({ ...current, actIspdn: "error" }));
      setDocumentGenerationError(error instanceof Error ? `Акт ввода ИСПДн: ${error.message}` : "Акт ввода ИСПДн не удалось подготовить.");
      setIsPreparingDocuments(false);
      return;
    }

    try {
      await safetyLevelDocumentRef.current.generate();
      setSafetyLevelActGenerated(true);
      setDocumentStatuses((current) => ({ ...current, safetyLevel: "prepared" }));
    } catch (error) {
      setSafetyLevelActGenerated(false);
      setDocumentStatuses((current) => ({ ...current, safetyLevel: "error" }));
      setDocumentGenerationError(
        error instanceof Error
          ? `Акт оценки уровня защищённости: ${error.message}`
          : "Акт оценки уровня защищённости не удалось подготовить.",
      );
    } finally {
      setIsPreparingDocuments(false);
    }
  };

  const handleDocumentsFinish = () => {
    if (!card || !actIspdnGenerated || !safetyLevelActGenerated) {
      return;
    }
    allowExitRef.current = true;
    navigate(`/ispdns/${card.id}`);
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography component="h1" variant="h5" sx={{ fontWeight: 600 }}>
          Создание ИСПДн
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 820 }}>
          Заполните обязательные разделы последовательно. Выйти из процесса через интерфейс можно только после
          завершения всех 7 шагов, включая выпуск документов.
        </Typography>
      </Box>

      {readinessQuery.isLoading && (
        <Paper variant="outlined" sx={{ p: 4, borderRadius: 2, textAlign: "center" }}>
          <CircularProgress size={28} />
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            Проверка карточки организации
          </Typography>
        </Paper>
      )}

      {readinessQuery.isError && (
        <Alert severity="error">
          Не удалось проверить готовность карточки организации. Создание ИСПДн будет доступно после успешной проверки.
        </Alert>
      )}

      {readinessQuery.data?.isReadyForIspdnCreation === false && (
        <Alert
          severity="warning"
          sx={{
            alignItems: "flex-start",
            "& .MuiAlert-message": { width: "100%" },
          }}
        >
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
            <Box>
              <AlertTitle>Заполните карточку организации</AlertTitle>
              <Typography sx={{ fontWeight: 600 }}>
                Вам нужно заполнить информацию о вашей организации, прежде чем создавать ИСПДн.
              </Typography>
            </Box>
            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={() => {
                allowExitRef.current = true;
                navigate("/organization");
              }}
              sx={{ alignSelf: { xs: "flex-start", md: "center" }, whiteSpace: "nowrap" }}
            >
              Перейти в карточку организации
            </Button>
          </Stack>
        </Alert>
      )}

      {canUseWizard && (
        <>
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
      {(createProcessMutation.isError || linkProcessMutation.isError) && (
        <Alert severity="error">
          Не удалось сохранить процессы обработки. Проверьте процессы обработки и доступность API.
        </Alert>
      )}
      {dataCentersMutation.isError && (
        <Alert severity="error">
          Не удалось сохранить связанные ЦОД. Проверьте доступность API и повторите попытку.
        </Alert>
      )}
      {cryptographyMutation.isError && (
        <Alert severity="error">
          Не удалось сохранить сведения о криптографии. Проверьте выбранные СКЗИ и доступность API.
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
            showSecurityTools={false}
            useTabs
            activeTab={cardFormTab}
            onActiveTabChange={setCardFormTab}
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
                будут сохранены, а wizard перейдёт к заполнению информации о ЦОД.
              </Typography>
            </Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignSelf: { sm: "flex-start" } }}>
              <Button variant="outlined" onClick={() => setProcessDialog({ mode: "link" })} disabled={isBusy}>
                Выбрать существующий
              </Button>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setProcessDialog({ mode: "create" })} disabled={isBusy}>
                Создать процесс обработки
              </Button>
            </Stack>
          </Stack>

          {(processingStepError || (linkedProcessesQuery.data?.length ?? 0) === 0) && (
            <Alert severity={processingStepError ? "error" : "warning"}>
              Добавьте хотя бы один процесс обработки, чтобы завершить создание ИСПДн.
            </Alert>
          )}

          {(linkedProcessesQuery.isLoading || (linkedProcessesQuery.data?.length ?? 0) > 0) && (
            <Paper variant="outlined" sx={{ borderRadius: 2, bgcolor: "background.paper" }}>
              <Box sx={{ p: 2 }}>
                <LinkedProcessingProcessesTable
                  processes={linkedProcessesQuery.data ?? []}
                  isLoading={linkedProcessesQuery.isLoading}
                />
              </Box>
            </Paper>
          )}
        </Stack>
      )}

      {activeStep === 4 && card && (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, bgcolor: "background.paper" }}>
          <Stack spacing={3}>
            <Box>
              <Typography component="h2" variant="h6" sx={{ fontWeight: 600 }}>
                Заполнение информации о ЦОД
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 760 }}>
                Выберите один или несколько ЦОД, связанных с создаваемой ИСПДн. Этот шаг можно оставить пустым.
              </Typography>
            </Box>
            <DataCenterSelect
              value={dataCenterIds}
              onChange={setDataCenterIds}
              disabled={isBusy}
              label="Связанные ЦОД"
            />
          </Stack>
        </Paper>
      )}

      {activeStep === 5 && card && (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, bgcolor: "background.paper" }}>
          <Stack spacing={3}>
            <Box>
              <Typography component="h2" variant="h6" sx={{ fontWeight: 600 }}>
                Использование криптографии
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 760 }}>
                Укажите, используются ли в создаваемой ИСПДн средства криптографической защиты информации.
              </Typography>
            </Box>
            <Box>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <Checkbox
                  checked={usesCryptography}
                  disabled={isBusy}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setUsesCryptography(checked);
                    if (!checked) {
                      setCryptoToolIds([]);
                      setCryptographyStepError(false);
                    }
                  }}
                />
                <Typography color={usesCryptography ? "text.primary" : "text.secondary"}>
                  Используется СКЗИ
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Используется СКЗИ в данной ИСПДн
              </Typography>
            </Box>
            {usesCryptography && (
              <CryptoToolSelect
                value={cryptoToolIds}
                onChange={(ids) => {
                  setCryptoToolIds(ids);
                  setCryptographyStepError(false);
                }}
                disabled={isBusy}
                label="Связанные СКЗИ"
              />
            )}
            {!usesCryptography && <Alert severity="info">СКЗИ не используются в данной ИСПДн.</Alert>}
            {cryptographyStepError && <Alert severity="error">Выберите минимум одно СКЗИ.</Alert>}
          </Stack>
        </Paper>
      )}

      {activeStep === 6 && card && (
        <Stack spacing={3}>
          <Box>
            <Typography component="h2" variant="h6" sx={{ fontWeight: 600 }}>
              Выпуск документов
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 760 }}>
              Сформируйте обязательные документы по созданной ИСПДн. Завершить мастер можно после выпуска обоих
              документов.
            </Typography>
          </Box>

          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, bgcolor: "background.paper" }}>
            <Stack spacing={2.5}>
              <Tabs
                value={documentTab}
                onChange={(_, value: number) => setDocumentTab(value)}
                variant="scrollable"
                allowScrollButtonsMobile
                sx={{ borderBottom: "1px solid", borderColor: "divider" }}
              >
                <Tab
                  label={
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <span>Акт ввода ИСПДн</span>
                      <DocumentStatusChip status={documentStatuses.actIspdn} />
                    </Stack>
                  }
                />
                <Tab
                  label={
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <span>Акт оценки уровня защищённости</span>
                      <DocumentStatusChip status={documentStatuses.safetyLevel} />
                    </Stack>
                  }
                />
              </Tabs>

              <Box sx={{ display: documentTab === 0 ? "block" : "none" }}>
                <Stack spacing={2.5}>
                  <Alert severity="info">
                    Документ фиксирует ввод ИСПДн в эксплуатацию и используется как один из внутренних организационных
                    документов.
                  </Alert>
                  <GenerateActIspdnDocumentForm
                    ref={actIspdnDocumentRef}
                    ispdnId={card.id}
                    showSubmitButton={false}
                    disabled={isPreparingDocuments}
                    onGenerated={() => {
                      setActIspdnGenerated(true);
                      setDocumentStatuses((current) => ({ ...current, actIspdn: "prepared" }));
                    }}
                  />
                </Stack>
              </Box>

              <Box sx={{ display: documentTab === 1 ? "block" : "none" }}>
                <Stack spacing={2.5}>
                  <Alert severity="info">
                    Документ фиксирует результаты определения необходимого уровня защищённости ИСПДн.
                  </Alert>
                  <GenerateActSafetyLevelDocumentForm
                    ref={safetyLevelDocumentRef}
                    ispdnId={card.id}
                    showSubmitButton={false}
                    disabled={isPreparingDocuments}
                    onGenerated={() => {
                      setSafetyLevelActGenerated(true);
                      setDocumentStatuses((current) => ({ ...current, safetyLevel: "prepared" }));
                    }}
                  />
                </Stack>
              </Box>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" } }}>
                <Button
                  type="button"
                  variant="contained"
                  onClick={handlePrepareAllDocuments}
                  disabled={isPreparingDocuments}
                >
                  {isPreparingDocuments ? "Документы подготавливаются..." : "Подготовить все документы"}
                </Button>
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                  <DocumentStatusChip status={documentStatuses.actIspdn} labelPrefix="Акт ввода" />
                  <DocumentStatusChip status={documentStatuses.safetyLevel} labelPrefix="Акт оценки" />
                </Stack>
              </Stack>
            </Stack>
          </Paper>

          {documentGenerationError && <Alert severity="error">{documentGenerationError}</Alert>}
          {(!actIspdnGenerated || !safetyLevelActGenerated) && (
            <Alert severity="info">Подготовьте оба документа, чтобы завершить создание ИСПДн.</Alert>
          )}
        </Stack>
      )}

      <WizardNavigation
        activeStep={activeStep}
        isBusy={isBusy}
        onBack={() => setActiveStep((current) => Math.max(0, current - 1))}
        onNext={
          activeStep === 3
            ? handleFinish
            : activeStep === 4
              ? () => dataCentersMutation.mutate()
            : activeStep === 5
                ? handleCryptographyFinish
                : activeStep === 6
                  ? handleDocumentsFinish
              : undefined
        }
        nextFormId={
          activeStep === 0
            ? "ispdn-card-form"
            : activeStep === 1
              ? "security-tools-create-form"
              : activeStep === 2
                ? "security-level-create-form"
                : undefined
        }
        nextLabel={activeStep === 6 ? "Завершить" : "Далее"}
        nextDisabled={
          (activeStep === 0 && cardFormTab < 2) ||
          (activeStep === 6 && (!actIspdnGenerated || !safetyLevelActGenerated))
        }
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
            Завершите разделы «Основные сведения», «Средства защиты внутри ИСПДн», «Информация о субъектах ПДн»,
            «Процессы обработки», «Заполнение информации о ЦОД», «Использование криптографии» и «Выпуск документов»,
            чтобы выйти из процесса создания.
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
        <DialogTitle>{processDialog?.mode === "link" ? "Выбрать процесс обработки" : "Создать процесс обработки"}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {processDialog?.mode === "link" ? (
              <FormControl fullWidth>
                <InputLabel id="processing-process-select-label">Процесс обработки</InputLabel>
                <Select
                  labelId="processing-process-select-label"
                  label="Процесс обработки"
                  value={selectedExistingProcessId}
                  onChange={(event) => setSelectedExistingProcessId(Number(event.target.value))}
                  disabled={isBusy || processOptionsQuery.isLoading}
                >
                  {processOptionsQuery.data?.map((process) => (
                    <MenuItem key={process.id} value={process.id}>
                      {process.purposeName} — {process.processingPeriod}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>Выберите процесс из глобального реестра.</FormHelperText>
              </FormControl>
            ) : (
              <ProcessingProcessForm
                key="new-processing-process"
                defaultValues={dialogDefaultValues}
                submitLabel="Создать и связать"
                isSubmitting={isBusy}
                onSubmit={handleProcessSubmit}
                onCancel={() => setProcessDialog(null)}
              />
            )}
          </Box>
        </DialogContent>
        {processDialog?.mode === "link" && (
          <DialogActions>
            <Button variant="outlined" onClick={() => setProcessDialog(null)} disabled={isBusy}>
              Отмена
            </Button>
            <Button variant="contained" onClick={handleLinkExistingProcess} disabled={isBusy || !selectedExistingProcessId}>
              Связать
            </Button>
          </DialogActions>
        )}
      </Dialog>
        </>
      )}
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

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            columnGap: 2,
            rowGap: 0.5,
          }}
        >
          {securityToolOptions.map((option) => {
            const checked = Boolean(values[option.key]);
            return (
              <Box key={option.key}>
                <Checkbox
                  checked={checked}
                  disabled={isBusy}
                  onChange={(event) => onChange({ ...values, [option.key]: event.target.checked })}
                  sx={{ verticalAlign: "middle" }}
                />
                <Typography
                  component="span"
                  onClick={() => !isBusy && onChange({ ...values, [option.key]: !checked })}
                  sx={{ cursor: isBusy ? "default" : "pointer", verticalAlign: "middle" }}
                >
                  {option.label}
                </Typography>
              </Box>
            );
          })}
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "flex-start" } }}>
          <TextField
            label="Иные средства защиты"
            placeholder="Укажите дополнительные средства защиты, если они используются в ИСПДн"
            fullWidth
            multiline
            minRows={3}
            value={values.otherSecurityTools ?? ""}
            onChange={(event) => onChange({ ...values, otherSecurityTools: event.target.value })}
            disabled={isBusy}
          />
          <Button type="submit" variant="outlined" disabled={isBusy} sx={{ minWidth: 120 }}>
            Сохранить
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

function WizardNavigation({
  activeStep,
  isBusy,
  nextFormId,
  nextLabel,
  nextDisabled = false,
  onBack,
  onNext,
}: {
  activeStep: number;
  isBusy: boolean;
  nextFormId?: string;
  nextLabel: string;
  nextDisabled?: boolean;
  onBack: () => void;
  onNext?: () => void;
}) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ justifyContent: "flex-start" }}>
      <Button variant="outlined" onClick={onBack} disabled={isBusy || activeStep === 0} sx={{ minWidth: 120 }}>
        Назад
      </Button>
      <Button
        type={nextFormId ? "submit" : "button"}
        form={nextFormId}
        variant="contained"
        onClick={onNext}
        disabled={isBusy || nextDisabled}
        sx={{ minWidth: 120 }}
      >
        {isBusy ? "Сохранение..." : nextLabel}
      </Button>
    </Stack>
  );
}

function DocumentStatusChip({ status, labelPrefix }: { status: DocumentStatus; labelPrefix?: string }) {
  const labels: Record<DocumentStatus, string> = {
    not_prepared: "Не подготовлен",
    prepared: "Подготовлен",
    error: "Ошибка подготовки",
  };
  const colors: Record<DocumentStatus, "default" | "success" | "error"> = {
    not_prepared: "default",
    prepared: "success",
    error: "error",
  };
  const label = labelPrefix ? `${labelPrefix}: ${labels[status]}` : labels[status];

  return <Chip label={label} color={colors[status]} size="small" />;
}

function LinkedProcessingProcessesTable({
  processes,
  isLoading,
}: {
  processes: ProcessingProcess[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return <Alert severity="info">Загрузка процессов обработки...</Alert>;
  }

  if (processes.length === 0) {
    return null;
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Цель обработки</TableCell>
            <TableCell>Период обработки</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {processes.map((process) => (
            <TableRow key={process.id} hover>
              <TableCell>
                <Typography sx={{ fontWeight: 600 }}>{process.purposeName}</Typography>
              </TableCell>
              <TableCell>{process.processingPeriod}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
