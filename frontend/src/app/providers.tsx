import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useState } from "react";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1f4e79",
    },
    secondary: {
      main: "#556b2f",
    },
    background: {
      default: "#f5f7fa",
    },
  },
  shape: {
    borderRadius: 6,
  },
});

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
