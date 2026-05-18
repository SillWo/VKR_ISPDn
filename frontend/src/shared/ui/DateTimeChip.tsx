import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { Chip } from "@mui/material";

type DateTimeChipProps = {
  label: string;
};

export function DateTimeChip({ label }: DateTimeChipProps) {
  return (
    <Chip
      size="small"
      icon={<AccessTimeIcon fontSize="small" />}
      label={label}
      variant="outlined"
      sx={{
        color: "text.secondary",
        borderColor: "divider",
        bgcolor: "background.default",
        "& .MuiChip-icon": {
          color: "text.secondary",
        },
      }}
    />
  );
}
