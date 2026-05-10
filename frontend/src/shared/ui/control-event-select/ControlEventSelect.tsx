import AddIcon from "@mui/icons-material/Add";
import { Alert, Autocomplete, Button, Stack, TextField, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { getControlEventOptions } from "../../../entities/control-event/api/controlEventApi";
import type { ControlEventOption } from "../../../entities/control-event/model/types";
import { ControlEventQuickCreateDialog } from "../../../features/control-event-quick-create/ui/ControlEventQuickCreateDialog";

type ControlEventSelectProps = {
  value: number | null;
  onChange: (controlEventId: number | null) => void;
  label?: string;
  required?: boolean;
  allowQuickCreate?: boolean;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  quickCreateButtonPlacement?: "below" | "inline";
  quickCreateButtonLabel?: string;
};

export function ControlEventSelect({
  value,
  onChange,
  label = "Контрольное мероприятие",
  required = false,
  allowQuickCreate = false,
  error = false,
  helperText,
  disabled = false,
  quickCreateButtonPlacement = "below",
  quickCreateButtonLabel = "Создать контрольное мероприятие",
}: ControlEventSelectProps) {
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const controlEventsQuery = useQuery({
    queryKey: ["controlEventOptions"],
    queryFn: getControlEventOptions,
  });

  const selectedControlEvent = useMemo(
    () => controlEventsQuery.data?.find((controlEvent) => controlEvent.id === value) ?? null,
    [controlEventsQuery.data, value],
  );

  const handleCreated = (controlEvent: ControlEventOption) => {
    onChange(controlEvent.id);
    setQuickCreateOpen(false);
  };

  const quickCreateButton = allowQuickCreate ? (
    <Button
      type="button"
      variant="outlined"
      startIcon={<AddIcon />}
      onClick={() => setQuickCreateOpen(true)}
      disabled={disabled}
      sx={{
        alignSelf: "flex-start",
        mt: quickCreateButtonPlacement === "inline" ? 0.5 : 0,
        whiteSpace: "nowrap",
      }}
    >
      {quickCreateButtonLabel}
    </Button>
  ) : null;

  const select = (
    <Autocomplete<ControlEventOption, false, false, false>
      options={controlEventsQuery.data ?? []}
      value={selectedControlEvent}
      loading={controlEventsQuery.isLoading}
      disabled={disabled}
      fullWidth
      getOptionLabel={(option) => option.name}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      onChange={(_, option) => onChange(option?.id ?? null)}
      renderOption={(props, option) => (
        <li {...props} key={option.id}>
          <Stack spacing={0.25}>
            <Typography sx={{ fontWeight: 600 }}>{option.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {option.description}
            </Typography>
          </Stack>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          error={error}
          helperText={helperText}
        />
      )}
    />
  );

  return (
    <Stack spacing={1} sx={{ width: "100%" }}>
      {controlEventsQuery.isError && <Alert severity="error">Не удалось загрузить контрольные мероприятия.</Alert>}
      {quickCreateButtonPlacement === "inline" && quickCreateButton ? (
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ alignItems: { md: "flex-start" } }}>
          {select}
          {quickCreateButton}
        </Stack>
      ) : (
        select
      )}
      {quickCreateButtonPlacement === "below" && quickCreateButton}
      <ControlEventQuickCreateDialog
        open={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
        onCreated={handleCreated}
      />
    </Stack>
  );
}
