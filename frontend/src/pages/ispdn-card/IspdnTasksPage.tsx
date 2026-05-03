import { Button, Stack, Typography } from "@mui/material";
import { Link as RouterLink, useParams } from "react-router-dom";

import { PlaceholderPage } from "../../shared/ui/PlaceholderPage";

export function IspdnTasksPage() {
  const { ispdnId } = useParams();

  return (
    <PlaceholderPage title="Задачи и несоответствия" description={`ИСПДн: ${ispdnId}. Функционал модуля будет реализован позже.`}>
      <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
        <Typography color="text.secondary">Здесь позже появятся задачи и несоответствия, связанные только с выбранной ИСПДн.</Typography>
        <Button component={RouterLink} to={`/ispdns/${ispdnId}`} variant="outlined">
          Назад к карточке ИСПДн
        </Button>
      </Stack>
    </PlaceholderPage>
  );
}
