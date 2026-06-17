import { Alert, Box, Button, CircularProgress, Paper, Stack, Tab, Tabs, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { getDocumentTypes } from "../../entities/document/api/documentApi";
import { globalDocumentFormRegistry } from "../../features/document-generation/model/globalDocumentFormRegistry";

const globalDocumentDescriptions: Record<string, string> = {
  RKN_notification:
    "Документ используется для первичного уведомления Роскомнадзора о намерении осуществлять обработку персональных данных.",
  RKN_notification_changes:
    "Документ используется для уведомления Роскомнадзора об изменении ранее поданных сведений.",
  PDn_security:
    "Документ фиксирует порядок организации и обеспечения защиты персональных данных.",
  PDn_document:
    "Документ фиксирует порядок обработки персональных данных в организации.",
  prikaz_otvet_za_PDn:
    "Документ назначает ответственного за организацию обработки персональных данных на уровне организации.",
};

export function DocumentsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const documentTypesQuery = useQuery({
    queryKey: ["document-types"],
    queryFn: getDocumentTypes,
    retry: false,
  });

  const globalDocumentTypes = useMemo(
    () => documentTypesQuery.data?.filter((documentType) => !documentType.requiresIspdn) ?? [],
    [documentTypesQuery.data],
  );
  const selectedDocumentType = globalDocumentTypes[activeTab] ?? null;
  const FormComponent = selectedDocumentType ? globalDocumentFormRegistry[selectedDocumentType.code] : null;

  useEffect(() => {
    if (activeTab >= globalDocumentTypes.length && globalDocumentTypes.length > 0) {
      setActiveTab(0);
    }
  }, [activeTab, globalDocumentTypes.length]);

  const handleTabChange = (value: number) => {
    setActiveTab(value);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography component="h1" variant="h5" sx={{ fontWeight: 600 }}>
          Документы
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: "background.paper" }}>
        <Stack spacing={3}>
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

          {globalDocumentTypes.length > 0 && (
            <>
              <Tabs
                value={activeTab}
                onChange={(_, value: number) => handleTabChange(value)}
                variant="scrollable"
                allowScrollButtonsMobile
                sx={{
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  "& .MuiTab-root": {
                    maxWidth: 320,
                    minHeight: 56,
                    whiteSpace: "normal",
                    lineHeight: 1.25,
                    alignItems: "flex-start",
                    textAlign: "left",
                  },
                }}
              >
                {globalDocumentTypes.map((documentType) => (
                  <Tab key={documentType.code} label={documentType.title} />
                ))}
              </Tabs>

              {selectedDocumentType && (
                <Stack spacing={2.5}>
                  <Box>
                    <Typography component="h2" variant="h6" sx={{ fontWeight: 600 }}>
                      {selectedDocumentType.title}
                    </Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                      {globalDocumentDescriptions[selectedDocumentType.code] ?? selectedDocumentType.description}
                    </Typography>
                  </Box>

                  {FormComponent ? (
                    <FormComponent />
                  ) : (
                    <Alert severity="warning">Для этого документа форма генерации ещё не реализована.</Alert>
                  )}

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                    <Button
                      type="button"
                      variant="outlined"
                      disabled={activeTab === 0}
                      onClick={() => handleTabChange(Math.max(activeTab - 1, 0))}
                    >
                      Назад
                    </Button>
                    {activeTab < globalDocumentTypes.length - 1 && (
                      <Button
                        type="button"
                        variant="contained"
                        onClick={() => handleTabChange(Math.min(activeTab + 1, globalDocumentTypes.length - 1))}
                      >
                        Далее
                      </Button>
                    )}
                  </Stack>
                </Stack>
              )}
            </>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
