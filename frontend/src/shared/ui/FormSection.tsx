import { Paper, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

type FormSectionProps = {
  title: string;
  children: ReactNode;
};

export function FormSection({ title, children }: FormSectionProps) {
  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, bgcolor: "background.paper" }}>
      <Stack spacing={2}>
        <Typography component="h2" variant="h6" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        {children}
      </Stack>
    </Paper>
  );
}
