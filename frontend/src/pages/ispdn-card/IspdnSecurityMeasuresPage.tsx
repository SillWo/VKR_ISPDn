import { Button, Stack, Typography } from "@mui/material";
import { Link as RouterLink, useParams } from "react-router-dom";

import { PlaceholderPage } from "../../shared/ui/PlaceholderPage";

export function IspdnSecurityMeasuresPage() {
  const { ispdnId } = useParams();

  return (
    <PlaceholderPage title="Технические меры защиты" description={`ИСПДн: ${ispdnId}. Функционал модуля будет реализован позже.`}>
      <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
        <Typography color="text.secondary">Здесь позже появится матрица технических мер защиты выбранной ИСПДн.</Typography>
        <Button component={RouterLink} to={`/ispdns/${ispdnId}`} variant="outlined">
          Назад к карточке ИСПДн
        </Button>
      </Stack>
    </PlaceholderPage>
  );
}
