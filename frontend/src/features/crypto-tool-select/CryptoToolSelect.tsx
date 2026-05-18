import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Alert,
  Button,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { getCryptoToolOptions } from "../../entities/crypto-tool/api/cryptoToolApi";
import type { CryptoToolOption } from "../../entities/crypto-tool/model/types";
import { SelectableItemsDialog } from "../../shared/ui/SelectableItemsDialog";
import { cryptoToolClassLabels } from "../crypto-tool-form/model/schema";
import { CryptoToolQuickCreateDialog } from "./CryptoToolQuickCreateDialog";

type CryptoToolSelectProps = {
  value: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
  label?: string;
};

export function CryptoToolSelect({
  value,
  onChange,
  disabled = false,
  label = "СКЗИ",
}: CryptoToolSelectProps) {
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
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
    <Stack spacing={2}>
      {cryptoToolsQuery.isError && <Alert severity="error">Не удалось загрузить список СКЗИ.</Alert>}
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
          Создать СКЗИ
        </Button>
      </Stack>

      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      {selectedCryptoTools.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography sx={{ fontWeight: 600 }}>СКЗИ пока не выбраны</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Выберите СКЗИ из реестра или создайте новое средство криптографической защиты информации.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Наименование</TableCell>
                <TableCell>Класс</TableCell>
                <TableCell>Производитель</TableCell>
                <TableCell>Серийный номер</TableCell>
                <TableCell align="right">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {selectedCryptoTools.map((cryptoTool) => (
                <TableRow key={cryptoTool.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{cryptoTool.name || "—"}</TableCell>
                  <TableCell>{cryptoToolClassLabels[cryptoTool.cryptoClass] || "—"}</TableCell>
                  <TableCell>{cryptoTool.manufacturer || "—"}</TableCell>
                  <TableCell>{cryptoTool.serialNumber || "—"}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      aria-label="Убрать СКЗИ"
                      onClick={() => onChange(value.filter((id) => id !== cryptoTool.id))}
                      disabled={disabled}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <SelectableItemsDialog
        open={selectOpen}
        title="Выбрать существующие СКЗИ"
        items={cryptoToolsQuery.data ?? []}
        selectedIds={value}
        getId={(item) => item.id}
        getPrimary={(item) => item.name}
        getSecondary={(item) =>
          `${cryptoToolClassLabels[item.cryptoClass] || "—"}, ${item.manufacturer || "—"}, № ${
            item.serialNumber || "—"
          }`
        }
        emptyText="В реестре СКЗИ пока нет записей"
        disabled={disabled || cryptoToolsQuery.isLoading}
        onClose={() => setSelectOpen(false)}
        onConfirm={(ids) => {
          onChange(ids);
          setSelectOpen(false);
        }}
      />
      <CryptoToolQuickCreateDialog
        open={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
        onCreated={handleCreated}
      />
    </Stack>
  );
}
