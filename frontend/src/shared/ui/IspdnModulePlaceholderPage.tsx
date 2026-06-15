import { Button, Stack, Typography } from "@mui/material";
import { Link as RouterLink, useParams } from "react-router-dom";

import { PlaceholderPage } from "./PlaceholderPage";

type IspdnModulePlaceholderPageProps = {
  title: string;
  body: string;
};

export function IspdnModulePlaceholderPage({ title, body }: IspdnModulePlaceholderPageProps) {
  const { ispdnId } = useParams();

  return (
    <PlaceholderPage title={title}>
      <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
        <Typography color="text.secondary">{body}</Typography>
        <Button component={RouterLink} to={`/ispdns/${ispdnId}`} variant="outlined">
          Назад к карточке ИСПДн
        </Button>
      </Stack>
    </PlaceholderPage>
  );
}
