import { FormControl, FormHelperText, MenuItem, Select } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateIspdnStatus } from "../api/ispdnApi";
import type { IspdnStatus } from "../model/types";

const statusLabels: Record<IspdnStatus, string> = {
  active: "Работает",
  archived: "Архив",
};

const statusStyles: Record<IspdnStatus, { color: string; backgroundColor: string; borderColor: string }> = {
  active: {
    color: "#1f7a55",
    backgroundColor: "rgba(68, 180, 139, 0.12)",
    borderColor: "rgba(68, 180, 139, 0.45)",
  },
  archived: {
    color: "#5f6368",
    backgroundColor: "rgba(124, 127, 136, 0.12)",
    borderColor: "rgba(124, 127, 136, 0.4)",
  },
};

type IspdnStatusSelectProps = {
  ispdnId: number;
  value: IspdnStatus;
};

export function IspdnStatusSelect({ ispdnId, value }: IspdnStatusSelectProps) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (status: IspdnStatus) => updateIspdnStatus(ispdnId, status),
    onSuccess: async (card) => {
      queryClient.setQueryData(["ispdn", ispdnId], card);
      await queryClient.invalidateQueries({ queryKey: ["ispdns"] });
    },
  });
  const displayValue = mutation.variables ?? value;

  return (
    <FormControl size="small" error={mutation.isError} sx={{ width: 132 }}>
      <Select
        value={displayValue}
        onChange={(event) => mutation.mutate(event.target.value as IspdnStatus)}
        disabled={mutation.isPending}
        displayEmpty
        sx={{
          bgcolor: statusStyles[displayValue].backgroundColor,
          color: statusStyles[displayValue].color,
          fontWeight: 600,
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: statusStyles[displayValue].borderColor,
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: statusStyles[displayValue].borderColor,
          },
          "& .MuiSelect-select": {
            py: 0.75,
            alignItems: "center",
          },
        }}
      >
        <MenuItem value="active">{statusLabels.active}</MenuItem>
        <MenuItem value="archived">{statusLabels.archived}</MenuItem>
      </Select>
      {mutation.isError && <FormHelperText>Не удалось сохранить</FormHelperText>}
    </FormControl>
  );
}
