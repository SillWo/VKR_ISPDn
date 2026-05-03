import MenuIcon from "@mui/icons-material/Menu";
import { useQuery } from "@tanstack/react-query";
import { AppBar, Box, Chip, Drawer, IconButton, Toolbar, Typography } from "@mui/material";
import { useState } from "react";
import { Outlet } from "react-router-dom";

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
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
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
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Платформа учёта и контроля ИСПДн
          </Typography>
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
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
        >
          <Toolbar />
          <MainNavigation />
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
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
