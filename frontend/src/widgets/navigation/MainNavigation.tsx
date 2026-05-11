import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import BusinessIcon from "@mui/icons-material/Business";
import DescriptionIcon from "@mui/icons-material/Description";
import DnsIcon from "@mui/icons-material/Dns";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import FolderSharedIcon from "@mui/icons-material/FolderShared";
import GroupsIcon from "@mui/icons-material/Groups";
import ListAltIcon from "@mui/icons-material/ListAlt";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import { List, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { NavLink } from "react-router-dom";

const navigationItems = [
  { label: "Реестр ИСПДн", path: "/ispdns", icon: <FolderSharedIcon /> },
  { label: "Карточка организации", path: "/organization", icon: <BusinessIcon /> },
  { label: "Реестр сотрудников", path: "/employees", icon: <GroupsIcon /> },
  { label: "Реестр процессов обработки", path: "/processing-processes", icon: <ListAltIcon /> },
  { label: "Реестр контрольных мероприятий", path: "/control-events", icon: <FactCheckIcon /> },
  { label: "Реестр ЦОД", path: "/data-centers", icon: <DnsIcon /> },
  { label: "Криптография", path: "/cryptography", icon: <VpnKeyIcon /> },
  { label: "Задачи и несоответствия", path: "/tasks", icon: <AssignmentTurnedInIcon /> },
  { label: "Документы", path: "/documents", icon: <DescriptionIcon /> },
];

export function MainNavigation() {
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
    </List>
  );
}
