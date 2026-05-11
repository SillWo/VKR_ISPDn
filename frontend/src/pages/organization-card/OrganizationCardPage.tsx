import { Alert, Box, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import { getOrganization, saveOrganization } from "../../entities/organization/api/organizationApi";
import type { OrganizationCard, OrganizationFormValues } from "../../entities/organization/model/types";
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
    headOfficeRegion: card.headOfficeRegion,
    activityRegions: card.activityRegions,
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

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["organization"],
    queryFn: getOrganization,
    retry: false,
  });

  const isNotCreated = isError && error instanceof HttpError && error.status === 404;

  const mutation = useMutation({
    mutationFn: saveOrganization,
    onSuccess: async (card) => {
      queryClient.setQueryData(["organization"], card);
      await queryClient.invalidateQueries({ queryKey: ["organization"] });
    },
  });

  const formValues = useMemo(() => (data ? toFormValues(data) : defaultOrganizationFormValues), [data]);

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

      {isLoading && (
        <Paper variant="outlined" sx={{ p: 4, borderRadius: 2, textAlign: "center" }}>
          <CircularProgress size={28} />
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            Загрузка карточки организации
          </Typography>
        </Paper>
      )}

      {!isLoading && isError && !isNotCreated && (
        <Alert severity="error">
          Не удалось загрузить карточку организации. Проверьте доступность backend API.
        </Alert>
      )}

      {!isLoading && isNotCreated && (
        <Alert severity="info">
          Карточка организации ещё не заполнена. Заполните обязательные сведения и сохраните форму.
        </Alert>
      )}

      {!isLoading && data && (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, bgcolor: "background.paper" }}>
          <Stack spacing={0.75}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {data.shortLegalName}
            </Typography>
            <Typography color="text.secondary">{data.fullLegalName}</Typography>
            <Typography variant="body2" color="text.secondary">
              Последнее обновление: {formatDateTime(data.updatedAt)}
            </Typography>
          </Stack>
        </Paper>
      )}

      {!isLoading && (data || isNotCreated) && (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, bgcolor: "background.paper" }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography component="h2" variant="h6" sx={{ fontWeight: 600 }}>
                {data ? "Редактирование сведений" : "Первичное заполнение"}
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
              submitLabel={data ? "Сохранить изменения" : "Сохранить карточку"}
              onSubmit={(values) => mutation.mutate(values)}
            />
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
