import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import BusinessIcon from "@mui/icons-material/Business";
import DescriptionIcon from "@mui/icons-material/Description";
import DnsIcon from "@mui/icons-material/Dns";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import FolderSharedIcon from "@mui/icons-material/FolderShared";
import GroupsIcon from "@mui/icons-material/Groups";
import ListAltIcon from "@mui/icons-material/ListAlt";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import { Collapse, List, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

const navigationItems = [
  { label: "Мои ИСПДн", path: "/ispdns", icon: <FolderSharedIcon /> },
  { label: "Карточка организации", path: "/organization", icon: <BusinessIcon /> },
  { label: "Задачи и несоответствия", path: "/tasks", icon: <AssignmentTurnedInIcon /> },
  { label: "Документы", path: "/documents", icon: <DescriptionIcon /> },
];

const registryItems = [
  { label: "Сотрудники", path: "/employees", icon: <GroupsIcon /> },
  { label: "Процессы обработки", path: "/processing-processes", icon: <ListAltIcon /> },
  { label: "Контрольные мероприятия", path: "/control-events", icon: <FactCheckIcon /> },
  { label: "ЦОД", path: "/data-centers", icon: <DnsIcon /> },
  { label: "Криптография", path: "/cryptography", icon: <VpnKeyIcon /> },
];

export function MainNavigation() {
  const location = useLocation();
  const isRegistrySectionActive = registryItems.some((item) => location.pathname.startsWith(item.path));
  const [registriesOpen, setRegistriesOpen] = useState(isRegistrySectionActive);

  useEffect(() => {
    if (isRegistrySectionActive) {
      setRegistriesOpen(true);
    }
  }, [isRegistrySectionActive]);

  return (
    <List component="nav" sx={{ py: 1 }}>
      {navigationItems.map((item) => (
        <ListItemButton
          key={item.path}
          component={NavLink}
          to={item.path}
          sx={{
            mx: 1,
            my: 0.25,
            borderRadius: 1,
            color: "text.primary",
            "&.active": {
              bgcolor: "primary.main",
              color: "primary.contrastText",
              "& .MuiListItemIcon-root": {
                color: "primary.contrastText",
              },
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: "text.secondary" }}>{item.icon}</ListItemIcon>
          <ListItemText primary={item.label} />
        </ListItemButton>
      ))}
      <ListItemButton
        selected={isRegistrySectionActive}
        onClick={() => setRegistriesOpen((value) => !value)}
        sx={{
          mx: 1,
          my: 0.25,
          borderRadius: 1,
          color: "text.primary",
          "&.Mui-selected": {
            bgcolor: "primary.main",
            color: "primary.contrastText",
            "& .MuiListItemIcon-root": {
              color: "primary.contrastText",
            },
            "&:hover": {
              bgcolor: "primary.main",
            },
          },
        }}
      >
        <ListItemIcon sx={{ minWidth: 40, color: isRegistrySectionActive ? "primary.contrastText" : "text.secondary" }}>
          <ListAltIcon />
        </ListItemIcon>
        <ListItemText primary="Реестры" />
        {registriesOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </ListItemButton>
      <Collapse in={registriesOpen} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {registryItems.map((item) => (
            <ListItemButton
              key={item.path}
              component={NavLink}
              to={item.path}
              sx={{
                mx: 1,
                my: 0.25,
                pl: 3,
                borderRadius: 1,
                color: "text.primary",
                "&.active": {
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  "& .MuiListItemIcon-root": {
                    color: "primary.contrastText",
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: "text.secondary" }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Collapse>
    </List>
  );
}
