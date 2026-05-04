import MenuIcon from "@mui/icons-material/Menu";
import { AppBar, Box, Chip, Drawer, IconButton, Toolbar, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link as RouterLink, Outlet } from "react-router-dom";

import { getApiHealth } from "../../shared/api/health";
import { MainNavigation } from "../navigation/MainNavigation";

const drawerWidth = 280;

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data, isError } = useQuery({
    queryKey: ["api-health"],
    queryFn: getApiHealth,
    retry: false,
  });

  const apiStatus = data?.status === "ok" ? "API: ok" : isError ? "API: недоступен" : "API: проверка";

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen((value) => !value)}
            sx={{ mr: 2, display: { md: "none" } }}
            aria-label="Открыть навигацию"
          >
            <MenuIcon />
          </IconButton>

          <Box
            component={RouterLink}
            to="/ispdns"
            aria-label="Перейти в реестр ИСПДн"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1.5,
              flexGrow: 1,
              width: "fit-content",
              minWidth: 0,
              textDecoration: "none",
              color: "text.primary",
            }}
          >
            <Box
              component="img"
              src="/logo.svg"
              alt="Логотип"
              sx={{
                display: "block",
                width: 44,
                height: 44,
                objectFit: "contain",
              }}
            />
            <Typography
              component="span"
              sx={{
                display: { xs: "none", sm: "inline" },
                fontSize: 18,
                lineHeight: 1.3,
                fontWeight: 600,
                color: "text.primary",
                whiteSpace: "nowrap",
              }}
            >
              Система контроля ИСПДн
            </Typography>
          </Box>

          <Chip label={apiStatus} color={data?.status === "ok" ? "success" : "default"} size="small" />
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth, borderColor: "divider" },
          }}
        >
          <Toolbar />
          <MainNavigation />
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth, borderColor: "divider" },
          }}
          open
        >
          <Toolbar />
          <MainNavigation />
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { md: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
