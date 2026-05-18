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
import { alpha, type SxProps, type Theme } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

const navigationItems = [
  { label: "Карточка организации", path: "/organization", icon: <BusinessIcon /> },
  { label: "Задачи и несоответствия", path: "/tasks", icon: <AssignmentTurnedInIcon /> },
  { label: "Документы", path: "/documents", icon: <DescriptionIcon /> },
];

const ispdnItems = [
  { label: "Реестр ИСПДн", path: "/ispdns", icon: <FolderSharedIcon /> },
  { label: "Архив ИСПДн", path: "/ispdns/archive", icon: <FolderSharedIcon /> },
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
  const isIspdnSectionActive = location.pathname.startsWith("/ispdns");
  const isIspdnRootActive = location.pathname === "/ispdns";
  const isIspdnArchiveActive = location.pathname === "/ispdns/archive";
  const activeSx: SxProps<Theme> = {
    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.5),
    color: "primary.contrastText",
    "& .MuiListItemIcon-root": {
      color: "primary.contrastText",
    },
    "&:hover": {
      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.6),
    },
  };
  const iconSx = { minWidth: 24, color: "text.secondary" };
  const [registriesOpen, setRegistriesOpen] = useState(isRegistrySectionActive);
  const [ispdnsOpen, setIspdnsOpen] = useState(isIspdnSectionActive);

  useEffect(() => {
    if (isRegistrySectionActive) {
      setRegistriesOpen(true);
    }
  }, [isRegistrySectionActive]);

  useEffect(() => {
    if (isIspdnSectionActive) {
      setIspdnsOpen(true);
    }
  }, [isIspdnSectionActive]);

  return (
    <List component="nav" sx={{ py: 1 }}>
      <ListItemButton
        selected={isIspdnSectionActive}
        onClick={() => setIspdnsOpen((value) => !value)}
        sx={{
          mx: 1,
          my: 0.25,
          borderRadius: 1,
          color: "text.primary",
          "&.Mui-selected": activeSx,
        }}
      >
        <ListItemIcon sx={{ ...iconSx, color: isIspdnSectionActive ? "primary.contrastText" : "text.secondary" }}>
          <FolderSharedIcon />
        </ListItemIcon>
        <ListItemText primary="Мои ИСПДн" />
        {ispdnsOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </ListItemButton>
      <Collapse in={ispdnsOpen} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {ispdnItems.map((item) => {
            const isActive = item.path === "/ispdns" ? isIspdnRootActive : isIspdnArchiveActive;

            return (
              <ListItemButton
                key={item.path}
                component={NavLink}
                to={item.path}
                end={item.path === "/ispdns"}
                sx={{
                  mx: 1,
                  my: 0.25,
                  pl: 3,
                  borderRadius: 1,
                  color: "text.primary",
                  "&.active": activeSx,
                }}
              >
                <ListItemIcon sx={{ ...iconSx, color: isActive ? "primary.contrastText" : "text.secondary" }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            );
          })}
        </List>
      </Collapse>
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
            "&.active": activeSx,
          }}
        >
          <ListItemIcon sx={iconSx}>{item.icon}</ListItemIcon>
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
          "&.Mui-selected": activeSx,
        }}
      >
        <ListItemIcon sx={{ ...iconSx, color: isRegistrySectionActive ? "primary.contrastText" : "text.secondary" }}>
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
                "&.active": activeSx,
              }}
            >
              <ListItemIcon sx={iconSx}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Collapse>
    </List>
  );
}
