import { Link as RouterLink, useParams } from "react-router-dom";
import { Button, Stack, Typography } from "@mui/material";

import { PlaceholderPage } from "../../shared/ui/PlaceholderPage";

const sections = [
  { label: "Процессы обработки", path: "processing" },
  { label: "Уровень защищённости", path: "security-level" },
  { label: "Технические меры", path: "security-measures" },
  { label: "Модель угроз", path: "threat-model" },
];

export function IspdnCardPage() {
  const { ispdnId } = useParams();

  return (
    <PlaceholderPage
      title="Карточка ИСПДн"
      description={`Заготовка карточки выбранной ИСПДн: ${ispdnId}.`}
    >
      <Stack spacing={2}>
        <Typography color="text.secondary">
          Связанные разделы открываются в контексте идентификатора ИСПДн из маршрута.
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          {sections.map((section) => (
            <Button key={section.path} component={RouterLink} to={`/ispdns/${ispdnId}/${section.path}`} variant="outlined">
              {section.label}
            </Button>
          ))}
        </Stack>
      </Stack>
    </PlaceholderPage>
  );
}
