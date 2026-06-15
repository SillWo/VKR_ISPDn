import { Paper, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

type PlaceholderPageProps = {
  title: string;
  children?: ReactNode;
};

export function PlaceholderPage({ title, children }: PlaceholderPageProps) {
  return (
    <Stack spacing={2}>
      <Typography component="h1" variant="h5" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, bgcolor: "background.paper" }}>
        {children ?? <Typography color="text.secondary">Раздел подготовлен как точка расширения для следующего этапа разработки.</Typography>}
      </Paper>
    </Stack>
  );
}
