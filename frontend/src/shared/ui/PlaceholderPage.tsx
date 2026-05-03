import { Box, Paper, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

type PlaceholderPageProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function PlaceholderPage({ title, description, children }: PlaceholderPageProps) {
  return (
    <Stack spacing={2}>
      <Box>
        <Typography component="h1" variant="h5" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          {description}
        </Typography>
      </Box>
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 1 }}>
        {children ?? (
          <Typography color="text.secondary">
            Раздел подготовлен как точка расширения для следующего этапа разработки.
          </Typography>
        )}
      </Paper>
    </Stack>
  );
}
