import { Button, Stack, Typography } from "@mui/material";
import { Link as RouterLink, useParams } from "react-router-dom";

import { PlaceholderPage } from "../../shared/ui/PlaceholderPage";

export function IspdnProcessingPage() {
  const { ispdnId } = useParams();

  return (
    <PlaceholderPage title="Процессы обработки" description={`ИСПДн: ${ispdnId}. Функционал модуля будет реализован позже.`}>
      <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
        <Typography color="text.secondary">Здесь позже появятся сведения о процессах обработки ПДн выбранной ИСПДн.</Typography>
        <Button component={RouterLink} to={`/ispdns/${ispdnId}`} variant="outlined">
          Назад к карточке ИСПДн
        </Button>
      </Stack>
    </PlaceholderPage>
  );
}
