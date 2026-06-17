import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink, useParams } from "react-router-dom";

import { getDocumentTypes } from "../../entities/document/api/documentApi";
import { GenerateActIspdnDocumentForm } from "../../features/document-generation/ui/GenerateActIspdnDocumentForm";
import { GenerateActSafetyLevelDocumentForm } from "../../features/document-generation/ui/GenerateActSafetyLevelDocumentForm";
import { GeneratePrikazOtvetZaBezopasnostDocumentForm } from "../../features/document-generation/ui/GeneratePrikazOtvetZaBezopasnostDocumentForm";
import { GeneratePrikazPerechenLicDocumentForm } from "../../features/document-generation/ui/GeneratePrikazPerechenLicDocumentForm";

export function IspdnDocumentsPage() {
  const { ispdnId } = useParams();
  const numericId = Number(ispdnId);
  const isValidId = Number.isInteger(numericId) && numericId > 0;

  const documentTypesQuery = useQuery({
    queryKey: ["document-types"],
    queryFn: getDocumentTypes,
    retry: false,
  });

  if (!isValidId) {
    return <Alert severity="error">Некорректный идентификатор ИСПДн в маршруте.</Alert>;
  }

  const actDocumentType = documentTypesQuery.data?.find((item) => item.code === "act_ispdn_commissioning");
  const safetyLevelDocumentType = documentTypesQuery.data?.find(
    (item) => item.code === "act_safety_level_of_ISPDn",
  );
  const prikazPerechenLicDocumentType = documentTypesQuery.data?.find((item) => item.code === "prikaz_perechen_lic");
  const prikazOtvetZaBezopasnostDocumentType = documentTypesQuery.data?.find(
    (item) => item.code === "prikaz_otvet_za_bezopasnost",
  );

  return (
    <Stack spacing={3}>
      <Box>
        <Typography component="h1" variant="h5" sx={{ fontWeight: 600 }}>
          Документы по ИСПДн
        </Typography>
      </Box>

      <Button
        component={RouterLink}
        to={`/ispdns/${numericId}`}
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        sx={{ alignSelf: "flex-start" }}
      >
        Назад к карточке ИСПДн
      </Button>

      {documentTypesQuery.isLoading && (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, textAlign: "center" }}>
          <CircularProgress size={28} />
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            Загрузка типов документов
          </Typography>
        </Paper>
      )}

      {documentTypesQuery.isError && (
        <Alert severity="error">
          Не удалось загрузить типы документов. Проверьте доступность backend API и повторите попытку.
        </Alert>
      )}

      {!documentTypesQuery.isLoading && !documentTypesQuery.isError && !actDocumentType && (
        <Alert severity="warning">Документ «Акт ввода ИСПДн» не зарегистрирован на backend.</Alert>
      )}

      {!documentTypesQuery.isLoading && !documentTypesQuery.isError && !safetyLevelDocumentType && (
        <Alert severity="warning">
          Документ «Акт оценки необходимого уровня защищённости ИСПДн» не зарегистрирован на backend.
        </Alert>
      )}

      {actDocumentType && (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, bgcolor: "background.paper" }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography component="h2" variant="h6" sx={{ fontWeight: 600 }}>
                {actDocumentType.title}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                {actDocumentType.description}
              </Typography>
            </Box>
            <GenerateActIspdnDocumentForm ispdnId={numericId} />
          </Stack>
        </Paper>
      )}

      {safetyLevelDocumentType && (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, bgcolor: "background.paper" }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography component="h2" variant="h6" sx={{ fontWeight: 600 }}>
                {safetyLevelDocumentType.title}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                {safetyLevelDocumentType.description}
              </Typography>
            </Box>
            <GenerateActSafetyLevelDocumentForm ispdnId={numericId} />
          </Stack>
        </Paper>
      )}

      {prikazPerechenLicDocumentType && (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, bgcolor: "background.paper" }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography component="h2" variant="h6" sx={{ fontWeight: 600 }}>
                {prikazPerechenLicDocumentType.title}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                {prikazPerechenLicDocumentType.description}
              </Typography>
            </Box>
            <GeneratePrikazPerechenLicDocumentForm ispdnId={numericId} />
          </Stack>
        </Paper>
      )}

      {prikazOtvetZaBezopasnostDocumentType && (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, bgcolor: "background.paper" }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography component="h2" variant="h6" sx={{ fontWeight: 600 }}>
                {prikazOtvetZaBezopasnostDocumentType.title}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                {prikazOtvetZaBezopasnostDocumentType.description}
              </Typography>
            </Box>
            <GeneratePrikazOtvetZaBezopasnostDocumentForm ispdnId={numericId} />
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
