import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useState } from "react";

import { AuthProvider } from "../features/auth/AuthProvider";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#111a4a",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#ec652b",
      contrastText: "#ffffff",
    },
    success: {
      main: "#44b48b",
    },
    info: {
      main: "#7ea7e9",
    },
    warning: {
      main: "#b86b00",
    },
    error: {
      main: "#d14343",
    },
    background: {
      default: "#f6f6f8",
      paper: "#ffffff",
    },
    text: {
      primary: "#011821",
      secondary: "#7c7f88",
    },
    divider: "#e3e4e8",
  },
  typography: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
    h5: {
      fontSize: "24px",
      lineHeight: 1.33,
      fontWeight: 600,
      letterSpacing: 0,
      color: "#011821",
    },
    h6: {
      fontSize: "18px",
      lineHeight: 1.4,
      fontWeight: 600,
      letterSpacing: 0,
      color: "#011821",
    },
    body1: {
      fontSize: "14px",
      lineHeight: 1.5,
      letterSpacing: 0,
    },
    body2: {
      fontSize: "13px",
      lineHeight: 1.5,
      letterSpacing: 0,
    },
    button: {
      textTransform: "none",
      fontWeight: 500,
      letterSpacing: 0,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#f6f6f8",
          color: "#232730",
        },
        "*": {
          boxSizing: "border-box",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          color: "#011821",
          borderBottom: "1px solid #e3e4e8",
          boxShadow: "none",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          minHeight: 36,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
      },
    },
    MuiSelect: {
      defaultProps: {
        size: "small",
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: "#ffffff",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: "#f6f6f8",
          color: "#7c7f88",
          fontSize: "12px",
          fontWeight: 600,
          borderBottom: "1px solid #e3e4e8",
        },
        body: {
          color: "#232730",
          fontSize: "14px",
          borderBottom: "1px solid #e3e4e8",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
        },
      },
    },
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
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
