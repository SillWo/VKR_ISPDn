import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Alert,
  Box,
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
  Tooltip,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { getProcessingPurposeOptions } from "../../../entities/processing-purpose/api/processingPurposeApi";
import type { ProcessingPurposeOption } from "../../../entities/processing-purpose/model/types";
import { ProcessingPurposeQuickCreateDialog } from "../../../features/processing-purpose-quick-create/ui/ProcessingPurposeQuickCreateDialog";
import { ProcessingPurposeSelect } from "../../../shared/ui/processing-purpose-select/ProcessingPurposeSelect";

type IspdnProcessingPurposesFieldProps = {
  value: number[];
  onChange: (purposeIds: number[]) => void;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
};

export function IspdnProcessingPurposesField({
  value,
  onChange,
  error,
  helperText,
  disabled,
}: IspdnProcessingPurposesFieldProps) {
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["processingPurposeOptions"],
    queryFn: getProcessingPurposeOptions,
  });

  const selectedPurposes = useMemo(
    () =>
      value
        .map((purposeId) => data.find((purpose) => purpose.id === purposeId))
        .filter((purpose) => purpose !== undefined),
    [data, value],
  );

  const handleSelect = (purposeId: number | null) => {
    if (purposeId === null || value.includes(purposeId)) {
      return;
    }
    onChange([...value, purposeId]);
  };

  const handleCreated = (purpose: ProcessingPurposeOption) => {
    if (!value.includes(purpose.id)) {
      onChange([...value, purpose.id]);
    }
    setQuickCreateOpen(false);
  };

  const handleRemove = (purposeId: number) => {
    onChange(value.filter((id) => id !== purposeId));
  };

  return (
    <Stack spacing={2}>
      {isError && <Alert severity="error">Не удалось загрузить цели обработки.</Alert>}
      {error && <Alert severity="error">{helperText}</Alert>}
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ alignItems: { md: "flex-start" } }}>
        <Box sx={{ flex: 1 }}>
          <ProcessingPurposeSelect
            value={null}
            onChange={handleSelect}
            label="Цель обработки"
            allowQuickCreate
            showQuickCreateButton={false}
            disabled={disabled || isLoading}
          />
        </Box>
        <Button
          type="button"
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setQuickCreateOpen(true)}
          disabled={disabled}
          sx={{ mt: { md: 0.5 }, whiteSpace: "nowrap" }}
        >
          Добавить цель
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
        {value.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 0 }}>
            Добавьте хотя бы одну цель обработки из реестра.
          </Alert>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Название</TableCell>
                  <TableCell>Период обработки</TableCell>
                  <TableCell align="right">Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedPurposes.map((purpose) => (
                  <TableRow key={purpose.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{purpose.name}</TableCell>
                    <TableCell>{purpose.processingPeriod}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Удалить из карточки">
                        <IconButton
                          aria-label="Удалить цель из карточки"
                          color="error"
                          onClick={() => handleRemove(purpose.id)}
                          disabled={disabled}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      <ProcessingPurposeQuickCreateDialog
        open={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
        onCreated={handleCreated}
      />
    </Stack>
  );
}
