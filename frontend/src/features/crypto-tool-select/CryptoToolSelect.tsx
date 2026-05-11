import AddIcon from "@mui/icons-material/Add";
import { Alert, Autocomplete, Button, Stack, TextField, Typography } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { getCryptoToolOptions } from "../../entities/crypto-tool/api/cryptoToolApi";
import type { CryptoToolOption } from "../../entities/crypto-tool/model/types";
import { cryptoToolClassLabels } from "../crypto-tool-form/model/schema";
import { CryptoToolQuickCreateDialog } from "./CryptoToolQuickCreateDialog";

type CryptoToolSelectProps = {
  value: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
  label?: string;
};

function getOptionLabel(option: CryptoToolOption) {
  return `${option.name} — ${cryptoToolClassLabels[option.cryptoClass]}, ${option.manufacturer}, № ${option.serialNumber}`;
}

export function CryptoToolSelect({
  value,
  onChange,
  disabled = false,
  label = "СКЗИ",
}: CryptoToolSelectProps) {
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const queryClient = useQueryClient();

  const cryptoToolsQuery = useQuery({
    queryKey: ["cryptoToolOptions"],
    queryFn: getCryptoToolOptions,
  });

  const selectedCryptoTools = useMemo(
    () =>
      value
        .map((id) => cryptoToolsQuery.data?.find((cryptoTool) => cryptoTool.id === id))
        .filter((cryptoTool): cryptoTool is CryptoToolOption => cryptoTool !== undefined),
    [cryptoToolsQuery.data, value],
  );

  const handleCreated = (cryptoTool: CryptoToolOption) => {
    void queryClient.invalidateQueries({ queryKey: ["cryptoToolOptions"] });
    if (!value.includes(cryptoTool.id)) {
      onChange([...value, cryptoTool.id]);
    }
    setQuickCreateOpen(false);
  };

  return (
    <Stack spacing={1.5}>
      {cryptoToolsQuery.isError && <Alert severity="error">Не удалось загрузить список СКЗИ.</Alert>}
      <Autocomplete<CryptoToolOption, true, false, false>
        multiple
        options={cryptoToolsQuery.data ?? []}
        value={selectedCryptoTools}
        loading={cryptoToolsQuery.isLoading}
        disabled={disabled}
        fullWidth
        getOptionLabel={getOptionLabel}
        isOptionEqualToValue={(option, selected) => option.id === selected.id}
        onChange={(_, options) => onChange(options.map((option) => option.id))}
        renderOption={(props, option) => (
          <li {...props} key={option.id}>
            <Stack spacing={0.25}>
              <Typography sx={{ fontWeight: 600 }}>{option.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {cryptoToolClassLabels[option.cryptoClass]}, {option.manufacturer}, № {option.serialNumber}
              </Typography>
            </Stack>
          </li>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            helperText="Выберите одно или несколько СКЗИ из реестра."
          />
        )}
      />
      <Button
        type="button"
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={() => setQuickCreateOpen(true)}
        disabled={disabled}
        sx={{ alignSelf: "flex-start" }}
      >
        Создать СКЗИ
      </Button>
      <CryptoToolQuickCreateDialog
        open={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
        onCreated={handleCreated}
      />
    </Stack>
  );
}
