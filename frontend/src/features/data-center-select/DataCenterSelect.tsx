import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { Alert, Box, Button, Divider, IconButton, Paper, Stack, Typography } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { getDataCenterOptions } from "../../entities/data-center/api/dataCenterApi";
import type { DataCenterOption } from "../../entities/data-center/model/types";
import { selectItemsByIds } from "../../shared/lib/selectItemsByIds";
import { SelectableItemsDialog } from "../../shared/ui/SelectableItemsDialog";
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
  const [selectOpen, setSelectOpen] = useState(false);
  const queryClient = useQueryClient();
  const dataCentersQuery = useQuery({
    queryKey: ["dataCenterOptions"],
    queryFn: getDataCenterOptions,
  });

  const selectedDataCenters = useMemo(
    () => selectItemsByIds(value, dataCentersQuery.data, (dataCenter) => dataCenter.id),
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
    <Stack spacing={2}>
      {dataCentersQuery.isError && <Alert severity="error">Не удалось загрузить список ЦОД.</Alert>}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <Button type="button" variant="outlined" onClick={() => setSelectOpen(true)} disabled={disabled}>
          Выбрать существующий
        </Button>
        <Button
          type="button"
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setQuickCreateOpen(true)}
          disabled={disabled}
        >
          Создать ЦОД
        </Button>
      </Stack>

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          {label}
        </Typography>
        {selectedDataCenters.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography sx={{ fontWeight: 600 }}>ЦОД пока не выбран</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Вы можете выбрать существующий ЦОД из реестра или создать новый. Этот шаг можно оставить пустым, если ЦОД
              не используется.
            </Typography>
          </Paper>
        ) : (
          <Paper variant="outlined" sx={{ borderRadius: 2 }}>
            <Stack divider={<Divider />}>
              {selectedDataCenters.map((dataCenter) => (
                <Stack
                  key={dataCenter.id}
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  sx={{ p: 2, alignItems: { sm: "center" }, justifyContent: "space-between" }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>{dataCenter.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {dataCenter.locationCountry || "—"} · {dataCenter.locationAddress || "—"} ·{" "}
                      {dataCenter.ownerDisplayName || (dataCenter.isOwnDataCenter ? "Собственный ЦОД" : "Не указано")}
                    </Typography>
                  </Box>
                  <IconButton
                    aria-label="Убрать ЦОД"
                    onClick={() => onChange(value.filter((id) => id !== dataCenter.id))}
                    disabled={disabled}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
          </Paper>
        )}
      </Box>
      <SelectableItemsDialog
        open={selectOpen}
        title="Выбрать существующие ЦОД"
        items={dataCentersQuery.data ?? []}
        selectedIds={value}
        getId={(item) => item.id}
        getPrimary={(item) => item.name}
        getSecondary={(item) =>
          `${item.locationCountry || "—"}, ${item.locationAddress || "—"} · ${
            item.ownerDisplayName || (item.isOwnDataCenter ? "Собственный ЦОД" : "Не указано")
          }`
        }
        emptyText="В реестре ЦОД пока нет записей"
        disabled={disabled || dataCentersQuery.isLoading}
        onClose={() => setSelectOpen(false)}
        onConfirm={(ids) => {
          onChange(ids);
          setSelectOpen(false);
        }}
      />
      <DataCenterQuickCreateDialog
        open={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
        onCreated={handleCreated}
      />
    </Stack>
  );
}
