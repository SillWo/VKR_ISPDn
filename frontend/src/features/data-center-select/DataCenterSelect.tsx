import AddIcon from "@mui/icons-material/Add";
import { Alert, Autocomplete, Button, Stack, TextField, Typography } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { getDataCenterOptions } from "../../entities/data-center/api/dataCenterApi";
import type { DataCenterOption } from "../../entities/data-center/model/types";
import { DataCenterQuickCreateDialog } from "./DataCenterQuickCreateDialog";

type DataCenterSelectProps = {
  value: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
  label?: string;
};

export function DataCenterSelect({
  value,
  onChange,
  disabled = false,
  label = "ЦОД",
}: DataCenterSelectProps) {
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const queryClient = useQueryClient();
  const dataCentersQuery = useQuery({
    queryKey: ["dataCenterOptions"],
    queryFn: getDataCenterOptions,
  });

  const selectedDataCenters = useMemo(
    () =>
      value
        .map((id) => dataCentersQuery.data?.find((dataCenter) => dataCenter.id === id))
        .filter((dataCenter): dataCenter is DataCenterOption => dataCenter !== undefined),
    [dataCentersQuery.data, value],
  );

  const handleCreated = (dataCenter: DataCenterOption) => {
    void queryClient.invalidateQueries({ queryKey: ["dataCenterOptions"] });
    if (!value.includes(dataCenter.id)) {
      onChange([...value, dataCenter.id]);
    }
    setQuickCreateOpen(false);
  };

  return (
    <Stack spacing={1.5}>
      {dataCentersQuery.isError && <Alert severity="error">Не удалось загрузить список ЦОД.</Alert>}
      <Autocomplete<DataCenterOption, true, false, false>
        multiple
        options={dataCentersQuery.data ?? []}
        value={selectedDataCenters}
        loading={dataCentersQuery.isLoading}
        disabled={disabled}
        fullWidth
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, selected) => option.id === selected.id}
        onChange={(_, options) => onChange(options.map((option) => option.id))}
        renderOption={(props, option) => (
          <li {...props} key={option.id}>
            <Stack spacing={0.25}>
              <Typography sx={{ fontWeight: 600 }}>{option.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {option.locationCountry}, {option.locationAddress} · {option.ownerDisplayName}
              </Typography>
            </Stack>
          </li>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            helperText="Выберите один или несколько ЦОД из реестра."
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
        Создать ЦОД
      </Button>
      <DataCenterQuickCreateDialog
        open={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
        onCreated={handleCreated}
      />
    </Stack>
  );
}
