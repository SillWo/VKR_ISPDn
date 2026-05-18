import { Paper, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

type FormSectionProps = {
  title: string;
  children: ReactNode;
};

export function FormSection({ title, children }: FormSectionProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        bgcolor: "background.paper",
        boxShadow:
          "rgba(17, 26, 74, 0.04) 0px 0px 0px 1px, rgba(17, 26, 74, 0.06) 0px 8px 20px -16px",
      }}
    >
      <Stack spacing={2}>
        <Typography component="h2" variant="h6" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        {children}
      </Stack>
    </Paper>
  );
}
