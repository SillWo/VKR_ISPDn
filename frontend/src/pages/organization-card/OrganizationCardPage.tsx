import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { deleteOrganization } from "../../entities/auth/api/authApi";
import { getOrganization, saveOrganization } from "../../entities/organization/api/organizationApi";
import type { OrganizationCard, OrganizationFormValues } from "../../entities/organization/model/types";
import { useAuth } from "../../features/auth/AuthProvider";
import { defaultOrganizationFormValues } from "../../features/organization-card-form/model/schema";
import { OrganizationCardForm } from "../../features/organization-card-form/ui/OrganizationCardForm";
import { HttpError } from "../../shared/api/httpClient";

function toFormValues(card: OrganizationCard): OrganizationFormValues {
  return {
    shortLegalName: card.shortLegalName,
    fullLegalName: card.fullLegalName,
    inn: card.inn,
    ogrn: card.ogrn,
    kpp: card.kpp,
    headEmployeeId: card.headEmployeeId,
    registrationAddress: card.registrationAddress,
    registrationCity: card.registrationCity,
    operatorType: card.operatorType,
    identityDocumentType: card.identityDocumentType,
    identityDocumentName: card.identityDocumentName,
    identityDocumentSeries: card.identityDocumentSeries,
    identityDocumentNumber: card.identityDocumentNumber,
    identityDocumentIssuedBy: card.identityDocumentIssuedBy,
    identityDocumentIssuedDate: card.identityDocumentIssuedDate,
    headOfficeRegion: card.headOfficeRegion,
    activityRegions: card.activityRegions,
    rknOfficeAddress: card.rknOfficeAddress,
    postalAddressMatchesRegistration: card.postalAddressMatchesRegistration,
    postalAddress: card.postalAddress,
    phone: card.phone,
    fax: card.fax,
    email: card.email,
    okpo: card.okpo,
    okfs: card.okfs,
    okogu: card.okogu,
    okopf: card.okopf,
    documentApproverEmployeeId: card.documentApproverEmployeeId,
    informationSecurityResponsibleEmployeeId: card.informationSecurityResponsibleEmployeeId,
    personalDataProcessingResponsibleEmployeeId: card.personalDataProcessingResponsibleEmployeeId,
    personalDataProcessingTerminationType: card.personalDataProcessingTerminationType,
    personalDataProcessingTerminationDate: card.personalDataProcessingTerminationDate,
    personalDataProcessingTerminationCondition: card.personalDataProcessingTerminationCondition,
    okveds: card.okveds.map((item) => ({ code: item.code, name: item.name })),
    branches: card.branches.map((item) => ({ name: item.name, postalAddress: item.postalAddress })),
  };
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function OrganizationCardPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const auth = useAuth();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [lastLoadedCard, setLastLoadedCard] = useState<OrganizationCard | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["organization", auth.user?.organizationId],
    queryFn: getOrganization,
    enabled: Boolean(auth.user?.organizationId),
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (data) {
      setLastLoadedCard(data);
    }
  }, [data]);

  const visibleCard = data ?? lastLoadedCard;
  const isInitialLoading = isLoading && !visibleCard;
  const isNotCreated = !visibleCard && isError && error instanceof HttpError && error.status === 404;

  const mutation = useMutation({
    mutationFn: saveOrganization,
    onSuccess: (card) => {
      setLastLoadedCard(card);
      queryClient.setQueryData(["organization", auth.user?.organizationId], card);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOrganization,
    onSuccess: () => {
      auth.clearAuth();
      navigate("/login", { replace: true });
    },
  });

  const formValues = useMemo(
    () => (visibleCard ? toFormValues(visibleCard) : defaultOrganizationFormValues),
    [visibleCard],
  );

  const closeDeleteDialog = () => {
    if (deleteMutation.isPending) {
      return;
    }
    setIsDeleteDialogOpen(false);
    setDeleteConfirmation("");
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography component="h1" variant="h5" sx={{ fontWeight: 600 }}>
          Карточка организации
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 820 }}>
          Единая карточка юридического лица для документов, уведомлений и связанных процессов платформы.
        </Typography>
      </Box>

      {isInitialLoading && (
        <Paper variant="outlined" sx={{ p: 4, borderRadius: 2, textAlign: "center" }}>
          <CircularProgress size={28} />
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            Загрузка карточки организации
          </Typography>
        </Paper>
      )}

      {!isInitialLoading && isError && !isNotCreated && (
        <Alert severity="error">
          Не удалось обновить карточку организации. Проверьте доступность backend API.
        </Alert>
      )}

      {!isInitialLoading && isNotCreated && (
        <Alert severity="info">
          Карточка организации ещё не заполнена. Заполните обязательные сведения и сохраните форму.
        </Alert>
      )}

      {!isInitialLoading && visibleCard && (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, bgcolor: "background.paper" }}>
          <Stack spacing={0.75}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {visibleCard.shortLegalName}
            </Typography>
            <Typography color="text.secondary">{visibleCard.fullLegalName}</Typography>
            <Typography variant="body2" color="text.secondary">
              Последнее обновление: {formatDateTime(visibleCard.updatedAt)}
            </Typography>
          </Stack>
        </Paper>
      )}

      {!isInitialLoading && (visibleCard || isNotCreated) && (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, bgcolor: "background.paper" }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography component="h2" variant="h6" sx={{ fontWeight: 600 }}>
                {visibleCard ? "Редактирование сведений" : "Первичное заполнение"}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                В системе может существовать только одна карточка организации. Сохранение обновляет текущую запись.
              </Typography>
            </Box>

            {mutation.isError && (
              <Alert severity="error">
                Не удалось сохранить карточку организации. Проверьте заполнение полей и доступность API.
              </Alert>
            )}
            {mutation.isSuccess && <Alert severity="success">Карточка организации сохранена.</Alert>}

            <OrganizationCardForm
              defaultValues={formValues}
              isSubmitting={mutation.isPending}
              submitLabel={visibleCard ? "Сохранить изменения" : "Сохранить карточку"}
              onSubmit={(values) => mutation.mutate(values)}
            />
          </Stack>
        </Paper>
      )}

      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, borderColor: "error.main", bgcolor: "background.paper" }}>
        <Stack spacing={2}>
          <Box>
            <Typography component="h2" variant="h6" sx={{ fontWeight: 600 }}>
              Зона опасных действий
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Удаление организации уничтожит пользователя, сессии и все данные платформы.
            </Typography>
          </Box>

          {deleteMutation.isError && (
            <Alert severity="error">
              Не удалось удалить организацию. Проверьте доступность backend API и права текущего пользователя.
            </Alert>
          )}

          <Box>
            <Button color="error" variant="contained" onClick={() => setIsDeleteDialogOpen(true)}>
              Удалить организацию
            </Button>
          </Box>
        </Stack>
      </Paper>

      <Dialog open={isDeleteDialogOpen} onClose={closeDeleteDialog} fullWidth maxWidth="sm">
        <DialogTitle>Удалить организацию</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <DialogContentText>
              Это действие удалит организацию, пользователя и все данные платформы. Восстановить данные будет
              невозможно.
            </DialogContentText>
            <TextField
              label="Введите: Удалить"
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              disabled={deleteMutation.isPending}
              autoFocus
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} disabled={deleteMutation.isPending}>
            Отмена
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={deleteConfirmation !== "Удалить" || deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
          >
            Удалить организацию
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
