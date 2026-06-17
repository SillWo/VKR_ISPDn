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
import { useEffect, useMemo, useRef, useState } from "react";
import { useBlocker, useNavigate } from "react-router-dom";

import { createIspdn, deleteIspdn, updateIspdn } from "../../entities/ispdn/api/ispdnApi";
import { toIspdnFormValues } from "../../entities/ispdn/model/toIspdnFormValues";
import type { IspdnCard, IspdnFormValues, IspdnSecurityTools } from "../../entities/ispdn/model/types";
import { generateIspdnDocumentsZip } from "../../entities/document/api/documentApi";
import type { GenerateIspdnDocumentPayload } from "../../entities/document/model/types";
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
import { deriveSecurityLevelDataCategoriesFromProcesses } from "../../entities/security-level/model/deriveDataCategoriesFromProcesses";
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
import { GeneratePrikazOtvetZaBezopasnostDocumentForm } from "../../features/document-generation/ui/GeneratePrikazOtvetZaBezopasnostDocumentForm";
import type { GeneratePrikazOtvetZaBezopasnostDocumentFormHandle } from "../../features/document-generation/ui/GeneratePrikazOtvetZaBezopasnostDocumentForm";
import { GeneratePrikazPerechenLicDocumentForm } from "../../features/document-generation/ui/GeneratePrikazPerechenLicDocumentForm";
import type { GeneratePrikazPerechenLicDocumentFormHandle } from "../../features/document-generation/ui/GeneratePrikazPerechenLicDocumentForm";
import { HttpError } from "../../shared/api/httpClient";

const steps = [
  "Основные сведения",
  "Средства защиты внутри ИСПДн",
  "Процессы обработки",
  "Информация о субъектах ПДн",
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
type WizardDocumentKey = "actIspdn" | "safetyLevel" | "prikazOtvetZaBezopasnost" | "prikazPerechenLic";

const wizardDocuments = [
  {
    key: "actIspdn",
    documentType: "act_ispdn_commissioning",
    label: "Акт ввода ИСПДн",
  },
  {
    key: "safetyLevel",
    documentType: "act_safety_level_of_ISPDn",
    label: "Акт оценки уровня защищенности",
  },
  {
    key: "prikazOtvetZaBezopasnost",
    documentType: "prikaz_otvet_za_bezopasnost",
    label: "Приказ о назначении ответственного за безопасность ПДн",
  },
  {
    key: "prikazPerechenLic",
    documentType: "prikaz_perechen_lic",
    label: "Приказ о перечне лиц с доступом к ПДн",
  },
] as const satisfies ReadonlyArray<{
  key: WizardDocumentKey;
  documentType: GenerateIspdnDocumentPayload["documentType"];
  label: string;
}>;

type DocumentZipErrorDetail = {
  document_type?: string;
  generated_document_types?: string[];
  message?: unknown;
};

const documentTabLabelTextSx = {
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 2,
  overflow: "hidden",
  whiteSpace: "normal",
  lineHeight: 1.25,
  textAlign: "left",
} as const;

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function findWizardDocumentByType(documentType: string | undefined) {
  return wizardDocuments.find((documentItem) => documentItem.documentType === documentType);
}

function parseZipGenerationError(error: unknown): DocumentZipErrorDetail | null {
  if (!(error instanceof HttpError)) {
    return null;
  }

  const jsonStart = error.message.indexOf("{");
  if (jsonStart === -1) {
    return null;
  }

  try {
    const detail = JSON.parse(error.message.slice(jsonStart)) as DocumentZipErrorDetail;
    return detail && typeof detail === "object" ? detail : null;
  } catch {
    return null;
  }
}

function formatZipGenerationMessage(message: unknown): string {
  if (typeof message === "string") {
    return message;
  }
  if (Array.isArray(message)) {
    return message
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }
        if (item && typeof item === "object" && "msg" in item && typeof item.msg === "string") {
          return item.msg;
        }
        return JSON.stringify(item);
      })
      .join("; ");
  }
  if (message && typeof message === "object") {
    return JSON.stringify(message);
  }
  return "Не удалось сформировать документ.";
}

function DocumentTabLabel({ title, status }: { title: string; status: DocumentStatus }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", maxWidth: 290 }}>
      <Box component="span" sx={{ ...documentTabLabelTextSx, minWidth: 0 }}>
        {title}
      </Box>
      <DocumentStatusChip status={status} />
    </Stack>
  );
}

export function IspdnCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const allowExitRef = useRef(false);
  const actIspdnDocumentRef = useRef<GenerateActIspdnDocumentFormHandle>(null);
  const safetyLevelDocumentRef = useRef<GenerateActSafetyLevelDocumentFormHandle>(null);
  const prikazOtvetZaBezopasnostDocumentRef = useRef<GeneratePrikazOtvetZaBezopasnostDocumentFormHandle>(null);
  const prikazPerechenLicDocumentRef = useRef<GeneratePrikazPerechenLicDocumentFormHandle>(null);
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
  const [documentTab, setDocumentTab] = useState(0);
  const [documentStatuses, setDocumentStatuses] = useState<Record<WizardDocumentKey, DocumentStatus>>({
    actIspdn: "not_prepared",
    safetyLevel: "not_prepared",
    prikazOtvetZaBezopasnost: "not_prepared",
    prikazPerechenLic: "not_prepared",
  });
  const [documentGenerationError, setDocumentGenerationError] = useState<string | null>(null);
  const [isPreparingDocuments, setIsPreparingDocuments] = useState(false);
  const areDocumentsPrepared =
    documentStatuses.actIspdn === "prepared"
    && documentStatuses.safetyLevel === "prepared"
    && documentStatuses.prikazOtvetZaBezopasnost === "prepared"
    && documentStatuses.prikazPerechenLic === "prepared";
  const isCardFormLastTab = cardFormTab >= 2;
  const shouldShowWizardNavigation = activeStep !== 0 || isCardFormLastTab;

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
    enabled: (activeStep === 2 || activeStep === 3) && Boolean(card),
  });

  const automaticSecurityLevelDataCategories = useMemo(
    () =>
      linkedProcessesQuery.data
        ? deriveSecurityLevelDataCategoriesFromProcesses(linkedProcessesQuery.data)
        : undefined,
    [linkedProcessesQuery.data],
  );
  const isSecurityLevelBlockedByProcesses =
    activeStep === 3 &&
    (linkedProcessesQuery.isLoading || linkedProcessesQuery.isError || linkedProcessesQuery.data === undefined);

  const processOptionsQuery = useQuery({
    queryKey: ["processingProcessOptions"],
    queryFn: getProcessingProcessOptions,
    enabled: activeStep === 2 || processDialog?.mode === "link",
  });

  const cardMutation = useMutation({
    mutationFn: (values: IspdnFormValues) => (card ? updateIspdn(card.id, values) : createIspdn(values)),
    onSuccess: async (savedCard) => {
      setCard(savedCard);
      setCardValues(toIspdnFormValues(savedCard));
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
      setCardValues(toIspdnFormValues(savedCard));
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
      setActiveStep(4);
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
    setActiveStep(3);
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
    if (
      !card
      || !actIspdnDocumentRef.current
      || !safetyLevelDocumentRef.current
      || !prikazOtvetZaBezopasnostDocumentRef.current
      || !prikazPerechenLicDocumentRef.current
    ) {
      return;
    }

    setIsPreparingDocuments(true);
    setDocumentGenerationError(null);
    setDocumentStatuses({
      actIspdn: "not_prepared",
      safetyLevel: "not_prepared",
      prikazOtvetZaBezopasnost: "not_prepared",
      prikazPerechenLic: "not_prepared",
    });

    try {
      const documentHandles = [
        { ...wizardDocuments[0], getPayload: () => actIspdnDocumentRef.current!.getPayload() },
        { ...wizardDocuments[1], getPayload: () => safetyLevelDocumentRef.current!.getPayload() },
        {
          ...wizardDocuments[2],
          getPayload: () => prikazOtvetZaBezopasnostDocumentRef.current!.getPayload(),
        },
        { ...wizardDocuments[3], getPayload: () => prikazPerechenLicDocumentRef.current!.getPayload() },
      ];
      const documents: GenerateIspdnDocumentPayload[] = [];
      for (const documentHandle of documentHandles) {
        try {
          documents.push(await documentHandle.getPayload());
        } catch (error) {
          setDocumentStatuses((current) => ({ ...current, [documentHandle.key]: "error" }));
          const message = error instanceof Error ? error.message : "Проверьте ручные данные документа.";
          throw new Error(`${documentHandle.label}: ${message}`);
        }
      }
      const archive = await generateIspdnDocumentsZip(card.id, { documents });
      downloadBlob(archive.blob, archive.filename);
      setDocumentStatuses({
        actIspdn: "prepared",
        safetyLevel: "prepared",
        prikazOtvetZaBezopasnost: "prepared",
        prikazPerechenLic: "prepared",
      });
    } catch (error) {
      const zipErrorDetail = parseZipGenerationError(error);
      if (zipErrorDetail) {
        const generatedDocumentTypes = new Set(zipErrorDetail.generated_document_types ?? []);
        const failedDocument = findWizardDocumentByType(zipErrorDetail.document_type);
        setDocumentStatuses((current) => {
          const nextStatuses = { ...current };
          for (const documentItem of wizardDocuments) {
            if (generatedDocumentTypes.has(documentItem.documentType)) {
              nextStatuses[documentItem.key] = "prepared";
            }
          }
          if (failedDocument) {
            nextStatuses[failedDocument.key] = "error";
          }
          return nextStatuses;
        });
        const label = failedDocument?.label ?? "Документ";
        setDocumentGenerationError(`${label}: ${formatZipGenerationMessage(zipErrorDetail.message)}`);
      } else {
        const validationMessage = error instanceof Error ? error.message : "Проверьте ручные данные документов.";
        setDocumentGenerationError(validationMessage);
      }
    } finally {
      setIsPreparingDocuments(false);
    }
  };
  const handleDocumentsFinish = () => {
    if (!card) {
      return;
    }
    if (documentStatuses.actIspdn !== "prepared") {
      setDocumentTab(0);
      document.getElementById("ispdn-create-documents")?.scrollIntoView({ block: "start" });
      return;
    }
    if (documentStatuses.safetyLevel !== "prepared") {
      setDocumentTab(1);
      document.getElementById("ispdn-create-documents")?.scrollIntoView({ block: "start" });
      return;
    }
    if (documentStatuses.prikazOtvetZaBezopasnost !== "prepared") {
      setDocumentTab(2);
      document.getElementById("ispdn-create-documents")?.scrollIntoView({ block: "start" });
      return;
    }
    if (documentStatuses.prikazPerechenLic !== "prepared") {
      setDocumentTab(3);
      document.getElementById("ispdn-create-documents")?.scrollIntoView({ block: "start" });
      return;
    }
    allowExitRef.current = true;
    navigate(`/ispdns/${card.id}`);
  };

  const wizardNavigation = (
    <WizardNavigation
      activeStep={activeStep}
      isBusy={isBusy}
      backDisabled={activeStep === 0 && cardFormTab === 0}
      onBack={() => {
        if (activeStep === 0) {
          setCardFormTab((current) => Math.max(0, current - 1));
          return;
        }
        setActiveStep((current) => Math.max(0, current - 1));
      }}
      onNext={
        activeStep === 2
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
            : activeStep === 3
              ? "security-level-create-form"
              : undefined
      }
      nextLabel={activeStep === 6 ? "Завершить" : "Далее"}
      nextDisabled={
        activeStep === 0
          ? !isCardFormLastTab
          : activeStep === 3
            ? isSecurityLevelBlockedByProcesses
            : activeStep === 6
              ? !areDocumentsPrepared
              : false
      }
    />
  );

  return (
    <Stack spacing={3}>
      <Box>
        <Typography component="h1" variant="h5" sx={{ fontWeight: 600 }}>
          Создание ИСПДн
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
          <Stack spacing={3}>
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
          {shouldShowWizardNavigation && wizardNavigation}
          </Stack>
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

      {activeStep === 2 && (
        <Stack spacing={3}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
            <Box>
              <Typography component="h2" variant="h6" sx={{ fontWeight: 600 }}>
                Процессы обработки
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 760 }}>
                Добавьте один или несколько процессов обработки для создаваемой ИСПДн. После нажатия «Далее» процессы
                будут сохранены, а мастер перейдёт к заполнению информации о субъектах ПДн.
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

      {activeStep === 3 && card && (
        <SecurityLevelForm
          key={card.id}
          formId="security-level-create-form"
          ispdnId={card.id}
          defaultValues={securityLevelValues}
          isSubmitting={isBusy}
          showActions={false}
          autoDataCategories={automaticSecurityLevelDataCategories}
          disableSubmit={isSecurityLevelBlockedByProcesses}
          submitDisabledReason={
            linkedProcessesQuery.isError
              ? "Не удалось загрузить связанные процессы обработки. Сохранение уровня защищённости отключено, чтобы не сохранить некорректные категории данных."
              : "Связанные процессы обработки загружаются. Сохранение уровня защищённости станет доступно после расчёта категорий данных."
          }
          onSubmit={(values) => securityLevelMutation.mutate(values)}
        />
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
              Сформируйте обязательные документы по созданной ИСПДн. Завершить мастер можно после выпуска всех
              документов.
            </Typography>
          </Box>

          <Paper id="ispdn-create-documents" variant="outlined" sx={{ p: 3, borderRadius: 2, bgcolor: "background.paper" }}>
            <Stack spacing={2.5}>
              <Tabs
                value={documentTab}
                onChange={(_, value: number) => setDocumentTab(value)}
                variant="scrollable"
                allowScrollButtonsMobile
                sx={{
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  "& .MuiTab-root": {
                    minHeight: 56,
                    maxWidth: 320,
                    whiteSpace: "normal",
                    alignItems: "stretch",
                  },
                }}
              >
                <Tab
                  label={<DocumentTabLabel title="Акт ввода ИСПДн" status={documentStatuses.actIspdn} />}
                />
                <Tab
                  label={
                    <DocumentTabLabel
                      title="Акт оценки уровня защищённости"
                      status={documentStatuses.safetyLevel}
                    />
                  }
                />
                <Tab
                  label={
                    <DocumentTabLabel
                      title="Приказ о назначении ответственного за безопасность ПДн"
                      status={documentStatuses.prikazOtvetZaBezopasnost}
                    />
                  }
                />
                <Tab
                  label={
                    <DocumentTabLabel
                      title="Приказ о перечне лиц с доступом к ПДн"
                      status={documentStatuses.prikazPerechenLic}
                    />
                  }
                />
              </Tabs>

              <Box sx={{ display: documentTab === 0 ? "block" : "none" }}>
                <Stack spacing={2.5}>
                  <GenerateActIspdnDocumentForm
                    ref={actIspdnDocumentRef}
                    ispdnId={card.id}
                    showSubmitButton={false}
                    disabled={isPreparingDocuments}
                    onGenerated={() => {
                      setDocumentStatuses((current) => ({ ...current, actIspdn: "prepared" }));
                    }}
                  />
                </Stack>
              </Box>

              <Box sx={{ display: documentTab === 1 ? "block" : "none" }}>
                <Stack spacing={2.5}>
                  <GenerateActSafetyLevelDocumentForm
                    ref={safetyLevelDocumentRef}
                    ispdnId={card.id}
                    showSubmitButton={false}
                    disabled={isPreparingDocuments}
                    onGenerated={() => {
                      setDocumentStatuses((current) => ({ ...current, safetyLevel: "prepared" }));
                    }}
                  />
                </Stack>
              </Box>

              <Box sx={{ display: documentTab === 2 ? "block" : "none" }}>
                <Stack spacing={2.5}>
                  <GeneratePrikazOtvetZaBezopasnostDocumentForm
                    ref={prikazOtvetZaBezopasnostDocumentRef}
                    ispdnId={card.id}
                    showSubmitButton={false}
                    disabled={isPreparingDocuments}
                    onGenerated={() => {
                      setDocumentStatuses((current) => ({ ...current, prikazOtvetZaBezopasnost: "prepared" }));
                    }}
                  />
                </Stack>
              </Box>

              <Box sx={{ display: documentTab === 3 ? "block" : "none" }}>
                <Stack spacing={2.5}>
                  <GeneratePrikazPerechenLicDocumentForm
                    ref={prikazPerechenLicDocumentRef}
                    ispdnId={card.id}
                    showSubmitButton={false}
                    disabled={isPreparingDocuments}
                    onGenerated={() => {
                      setDocumentStatuses((current) => ({ ...current, prikazPerechenLic: "prepared" }));
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
                  {isPreparingDocuments ? "Документы подготавливаются..." : "Подготовить документы"}
                </Button>
              </Stack>
            </Stack>
          </Paper>

          {documentGenerationError && <Alert severity="error">{documentGenerationError}</Alert>}
        </Stack>
      )}

      {activeStep !== 0 && shouldShowWizardNavigation && wizardNavigation}

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
            Завершите разделы «Основные сведения», «Средства защиты внутри ИСПДн», «Процессы обработки»,
            «Информация о субъектах ПДн», «Заполнение информации о ЦОД», «Использование криптографии» и «Выпуск документов»,
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
  backDisabled,
  onBack,
  onNext,
}: {
  activeStep: number;
  isBusy: boolean;
  nextFormId?: string;
  nextLabel: string;
  nextDisabled?: boolean;
  backDisabled?: boolean;
  onBack: () => void;
  onNext?: () => void;
}) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ justifyContent: "flex-start" }}>
      <Button
        variant="outlined"
        onClick={onBack}
        disabled={isBusy || backDisabled || (backDisabled === undefined && activeStep === 0)}
        sx={{ minWidth: 120 }}
      >
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
