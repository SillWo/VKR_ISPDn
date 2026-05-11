import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Alert, Box, Button, Chip, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";

import { getIspdnById, updateIspdn } from "../../entities/ispdn/api/ispdnApi";
import type { IspdnCard, IspdnFormValues, IspdnStatus } from "../../entities/ispdn/model/types";
import { IspdnCardForm } from "../../features/ispdn-card-form/ui/IspdnCardForm";
import { HttpError } from "../../shared/api/httpClient";

const sections = [
  { label: "Уровень защищённости", path: "security-level" },
  { label: "Технические меры защиты", path: "security-measures" },
  { label: "Процессы обработки", path: "processing" },
  { label: "Документы", path: "documents" },
  { label: "Связанные ЦОД", path: "data-centers" },
  { label: "Криптография", path: "cryptography" },
  { label: "Модель угроз", path: "threat-model" },
  { label: "Задачи и несоответствия", path: "tasks" },
];

const statusLabels: Record<IspdnStatus, string> = {
  active: "Работает",
  archived: "Архив",
};

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

export function IspdnCardPage() {
  const { ispdnId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const numericId = Number(ispdnId);
  const isValidId = Number.isInteger(numericId) && numericId > 0;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["ispdn", numericId],
    queryFn: () => getIspdnById(numericId),
    enabled: isValidId,
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: (values: IspdnFormValues) => updateIspdn(numericId, values),
    onSuccess: async (card) => {
      queryClient.setQueryData(["ispdn", numericId], card);
      await queryClient.invalidateQueries({ queryKey: ["ispdns"] });
    },
  });

  if (!isValidId) {
    return <Alert severity="error">Некорректный идентификатор ИСПДн в маршруте.</Alert>;
  }

  if (isLoading) {
    return (
      <Paper variant="outlined" sx={{ p: 4, borderRadius: 2, textAlign: "center" }}>
        <CircularProgress size={28} />
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          Загрузка карточки ИСПДн
        </Typography>
      </Paper>
    );
  }

  if (isError) {
    const isNotFound = error instanceof HttpError && error.status === 404;

    return (
      <Alert
        severity={isNotFound ? "warning" : "error"}
        action={
          <Button color="inherit" size="small" onClick={() => navigate("/ispdns")}>
            В реестр
          </Button>
        }
      >
        {isNotFound
          ? "Карточка ИСПДн не найдена. Возможно, запись ещё не создана или была удалена вне текущего интерфейса."
          : "Не удалось загрузить карточку ИСПДн. Проверьте доступность backend API."}
      </Alert>
    );
  }

  if (!data) {
    return <Alert severity="warning">Карточка ИСПДн не найдена.</Alert>;
  }

  return (
    <Stack spacing={3}>
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
        <Stack spacing={1.5}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "space-between" }}>
            <Box>
              <Typography component="h1" variant="h5" sx={{ fontWeight: 600 }}>
                {data.name}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                Карточка ИСПДн #{data.id}
              </Typography>
            </Box>
            <Chip label={statusLabels[data.status]} color={data.status === "active" ? "success" : "default"} sx={{ alignSelf: { sm: "flex-start" } }} />
          </Stack>
          <Typography>{data.shortDescription}</Typography>
          <Typography color="text.secondary">
            Ответственный: {data.responsibleEmployee?.fullName ?? data.responsiblePerson}
          </Typography>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, bgcolor: "background.paper" }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography component="h2" variant="h6" sx={{ fontWeight: 600 }}>
              Основные сведения
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Изменения сохраняются через API карточки ИСПДн и остаются привязанными к выбранному идентификатору.
            </Typography>
          </Box>
          {mutation.isError && <Alert severity="error">Не удалось сохранить изменения. Проверьте данные и доступность API.</Alert>}
          {mutation.isSuccess && <Alert severity="success">Изменения сохранены.</Alert>}
          <IspdnCardForm
            defaultValues={toFormValues(data)}
            submitLabel="Сохранить изменения"
            isSubmitting={mutation.isPending}
            legacyResponsiblePerson={data.responsiblePerson}
            onSubmit={(values) => mutation.mutate(values)}
            onCancel={() => navigate("/ispdns")}
          />
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
        <Stack spacing={2}>
          <Box>
            <Typography component="h2" variant="h6" sx={{ fontWeight: 600 }}>
              Связанные модули
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Переходы открываются в контексте текущей ИСПДн: {data.id}.
            </Typography>
          </Box>
          <Stack spacing={1.5}>
            {sections.map((section) => (
              <Button
                key={section.path}
                component={RouterLink}
                to={`/ispdns/${data.id}/${section.path}`}
                variant="outlined"
                endIcon={<ArrowForwardIcon />}
                fullWidth
                sx={{ justifyContent: "space-between" }}
              >
                {section.label}
              </Button>
            ))}
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
}
