import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link as RouterLink, useParams, useSearchParams } from "react-router-dom";

import { getIspdnSecurityLevel, saveIspdnSecurityLevel } from "../../entities/security-level/api/securityLevelApi";
import type { SecurityLevelFormValues, SecurityLevelRecord } from "../../entities/security-level/model/types";
import { defaultSecurityLevelFormValues } from "../../features/security-level-form/model/schema";
import { SecurityLevelForm } from "../../features/security-level-form/ui/SecurityLevelForm";
import { HttpError } from "../../shared/api/httpClient";

function toFormValues(record: SecurityLevelRecord | null): SecurityLevelFormValues {
  if (!record) {
    return defaultSecurityLevelFormValues;
  }

  return {
    dataCategories: record.dataCategories,
    subjectCountRange: record.subjectCountRange,
    threatType: record.threatType,
    subjectGroup: record.subjectGroup,
    recommendedLevel: record.recommendedLevel,
    actualLevel: record.actualLevel,
    deviationJustificationText: record.deviationJustificationText ?? "",
    deviationJustificationFile: null,
  };
}

export function IspdnSecurityLevelPage() {
  const { ispdnId } = useParams();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const numericId = Number(ispdnId);
  const isValidId = Number.isInteger(numericId) && numericId > 0;
  const fromCreate = searchParams.get("fromCreate") === "1";

  const securityLevelQuery = useQuery({
    queryKey: ["ispdnSecurityLevel", numericId],
    queryFn: () => getIspdnSecurityLevel(numericId),
    enabled: isValidId,
    retry: false,
  });

  const saveMutation = useMutation({
    mutationFn: (values: SecurityLevelFormValues) => saveIspdnSecurityLevel(numericId, values),
    onSuccess: async (record) => {
      queryClient.setQueryData(["ispdnSecurityLevel", numericId], record);
      queryClient.removeQueries({ queryKey: ["technicalSecurityMeasures", numericId] });
      await queryClient.invalidateQueries({ queryKey: ["ispdnSecurityLevel", numericId] });
      await queryClient.invalidateQueries({ queryKey: ["technicalSecurityMeasures", numericId] });
    },
  });

  if (!isValidId) {
    return <Alert severity="error">Некорректный идентификатор ИСПДн в маршруте.</Alert>;
  }

  const isEmpty = securityLevelQuery.error instanceof HttpError && securityLevelQuery.error.status === 404;
  const record = securityLevelQuery.data ?? null;

  return (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Button
          component={RouterLink}
          to={`/ispdns/${numericId}`}
          variant="text"
          startIcon={<ArrowBackIcon />}
          sx={{ alignSelf: "flex-start" }}
        >
          К карточке ИСПДн
        </Button>
        <Box>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 600 }}>
            Уровень защищённости
          </Typography>
        </Box>
      </Stack>

      {fromCreate && (
        <Alert severity="warning">
          Это обязательный шаг перед заполнением процессов обработки для новой ИСПДн.
        </Alert>
      )}

      {securityLevelQuery.isLoading && (
        <Paper variant="outlined" sx={{ p: 4, borderRadius: 2, textAlign: "center" }}>
          <CircularProgress size={28} />
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            Загрузка данных уровня защищённости
          </Typography>
        </Paper>
      )}

      {securityLevelQuery.isError && !isEmpty && (
        <Alert severity="error">Не удалось загрузить данные уровня защищённости. Проверьте доступность backend API.</Alert>
      )}

      {isEmpty && (
        <Alert severity="info">
          Информация о субъектах ПДн и уровне защищённости ещё не заполнена.
        </Alert>
      )}

      {saveMutation.isError && (
        <Alert severity="error">
          Не удалось сохранить уровень защищённости. Проверьте заполнение полей и формат файла обоснования.
        </Alert>
      )}

      {saveMutation.isSuccess && (
        <Alert
          severity="success"
          action={
            fromCreate ? (
              <Button
                color="inherit"
                size="small"
                component={RouterLink}
                to={`/ispdns/${numericId}/processing`}
                endIcon={<ArrowForwardIcon />}
              >
                Перейти к процессам обработки
              </Button>
            ) : undefined
          }
        >
          Уровень защищённости сохранён.
        </Alert>
      )}

      {!securityLevelQuery.isLoading && (!securityLevelQuery.isError || isEmpty) && (
        <SecurityLevelForm
          key={record?.updatedAt ?? "new-security-level"}
          ispdnId={numericId}
          defaultValues={toFormValues(record)}
          existingRecord={record}
          isSubmitting={saveMutation.isPending}
          onSubmit={(values) => saveMutation.mutate(values)}
        />
      )}
    </Stack>
  );
}
