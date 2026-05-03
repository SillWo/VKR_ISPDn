import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import BusinessIcon from "@mui/icons-material/Business";
import FolderSharedIcon from "@mui/icons-material/FolderShared";
import GroupsIcon from "@mui/icons-material/Groups";
import ListAltIcon from "@mui/icons-material/ListAlt";
import { List, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { NavLink } from "react-router-dom";

const navigationItems = [
  { label: "Реестр ИСПДн", path: "/ispdns", icon: <FolderSharedIcon /> },
  { label: "Карточка организации", path: "/organization", icon: <BusinessIcon /> },
  { label: "Реестр сотрудников", path: "/employees", icon: <GroupsIcon /> },
  { label: "Реестр целей обработки", path: "/processing-purposes", icon: <ListAltIcon /> },
  { label: "Задачи и несоответствия", path: "/tasks", icon: <AssignmentTurnedInIcon /> },
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
            "&.active": {
              bgcolor: "primary.main",
              color: "primary.contrastText",
              "& .MuiListItemIcon-root": {
                color: "primary.contrastText",
              },
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
          <ListItemText primary={item.label} />
        </ListItemButton>
      ))}
    </List>
  );
}
