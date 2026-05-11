import DescriptionIcon from "@mui/icons-material/Description";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";

import { getDocumentTypes } from "../../entities/document/api/documentApi";
import { globalDocumentFormRegistry } from "../../features/document-generation/model/globalDocumentFormRegistry";

const rknCardDescription =
  "Документ собирает данные организации, действующих ИСПДн, процессов обработки, ЦОД, СКЗИ и ответственных лиц.";

export function DocumentsPage() {
  const documentTypesQuery = useQuery({
    queryKey: ["document-types"],
    queryFn: getDocumentTypes,
    retry: false,
  });

  const globalDocumentTypes = documentTypesQuery.data?.filter((documentType) => !documentType.requiresIspdn) ?? [];

  return (
    <Stack spacing={3}>
      <Box>
        <Typography component="h1" variant="h5" sx={{ fontWeight: 600 }}>
          Документы
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Глобальные документы организации формируются по карточке организации, действующим ИСПДн и ручным данным формы.
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, bgcolor: "background.paper" }}>
        <Stack spacing={3}>
          <Box>
            <Typography component="h2" variant="h6" sx={{ fontWeight: 600 }}>
              Доступные документы уровня организации
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Список загружается из backend и показывает только документы без привязки к конкретной ИСПДн.
            </Typography>
          </Box>

          {documentTypesQuery.isLoading && (
            <Box sx={{ py: 3, textAlign: "center" }}>
              <CircularProgress size={28} />
              <Typography color="text.secondary" sx={{ mt: 2 }}>
                Загрузка типов документов
              </Typography>
            </Box>
          )}

          {documentTypesQuery.isError && (
            <Alert severity="error">
              Не удалось загрузить типы документов. Проверьте доступность backend API и повторите попытку.
            </Alert>
          )}

          {!documentTypesQuery.isLoading && !documentTypesQuery.isError && globalDocumentTypes.length === 0 && (
            <Alert severity="info">Документы уровня организации пока не зарегистрированы.</Alert>
          )}

          <Stack spacing={2}>
            {globalDocumentTypes.map((documentType) => {
              const FormComponent = globalDocumentFormRegistry[documentType.code];
              return (
                <Card key={documentType.code} variant="outlined">
                  <CardContent>
                    <Stack spacing={2.5}>
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        <DescriptionIcon color="primary" />
                        <Box>
                          <Typography component="h3" variant="h6" sx={{ fontWeight: 600 }}>
                            {documentType.title}
                          </Typography>
                          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                            {documentType.code === "RKN_notification"
                              ? rknCardDescription
                              : documentType.description}
                          </Typography>
                        </Box>
                      </Stack>

                      <Divider />

                      {FormComponent ? (
                        <FormComponent />
                      ) : (
                        <Alert severity="warning">Для этого документа форма генерации ещё не реализована.</Alert>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
}
