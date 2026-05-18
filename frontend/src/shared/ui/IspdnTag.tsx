import { Chip } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const tagPalette = [
  { bg: "rgba(22, 126, 108, 0.10)", color: "#167e6c", border: "rgba(22, 126, 108, 0.24)" },
  { bg: "rgba(126, 167, 233, 0.14)", color: "#315f9f", border: "rgba(126, 167, 233, 0.32)" },
  { bg: "rgba(17, 26, 74, 0.08)", color: "#111a4a", border: "rgba(17, 26, 74, 0.18)" },
  { bg: "rgba(236, 101, 43, 0.10)", color: "#a8471f", border: "rgba(236, 101, 43, 0.24)" },
  { bg: "rgba(111, 66, 193, 0.10)", color: "#5b2bbf", border: "rgba(111, 66, 193, 0.24)" },
];

type IspdnTagProps = {
  id?: number | null;
  name?: string | null;
};

export function IspdnTag({ id, name }: IspdnTagProps) {
  if (!id || !name) {
    return <Chip size="small" label="Без привязки к ИСПДн" variant="outlined" />;
  }

  const palette = tagPalette[id % tagPalette.length];

  return (
    <Chip
      size="small"
      label={name}
      component={RouterLink}
      to={`/ispdns/${id}`}
      clickable
      sx={{
        bgcolor: palette.bg,
        color: palette.color,
        border: "1px solid",
        borderColor: palette.border,
        fontWeight: 600,
        textDecoration: "none",
        "&:hover": {
          bgcolor: palette.bg,
          filter: "brightness(0.98)",
        },
      }}
    />
  );
}
