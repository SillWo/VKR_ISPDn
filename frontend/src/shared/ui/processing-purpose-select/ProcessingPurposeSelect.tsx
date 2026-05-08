import AddIcon from "@mui/icons-material/Add";
import {
  Alert,
  Box,
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { getProcessingPurposeOptions } from "../../../entities/processing-purpose/api/processingPurposeApi";
import type { ProcessingPurposeOption } from "../../../entities/processing-purpose/model/types";
import { ProcessingPurposeQuickCreateDialog } from "../../../features/processing-purpose-quick-create/ui/ProcessingPurposeQuickCreateDialog";

type ProcessingPurposeSelectProps = {
  value: number | null;
  onChange: (purposeId: number | null) => void;
  label?: string;
  required?: boolean;
  allowQuickCreate?: boolean;
  showQuickCreateButton?: boolean;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
};

export function ProcessingPurposeSelect({
  value,
  onChange,
  label = "Цель обработки",
  required,
  allowQuickCreate,
  showQuickCreateButton = true,
  error,
  helperText,
  disabled,
}: ProcessingPurposeSelectProps) {
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["processingPurposeOptions"],
    queryFn: getProcessingPurposeOptions,
  });

  const handleCreated = (purpose: ProcessingPurposeOption) => {
    onChange(purpose.id);
    setQuickCreateOpen(false);
  };

  return (
    <Stack spacing={1}>
      {isError && <Alert severity="error">Не удалось загрузить цели обработки.</Alert>}
      <FormControl fullWidth required={required} error={error} disabled={disabled || isLoading || isError}>
        <InputLabel id="processing-purpose-select-label">{label}</InputLabel>
        <Select
          labelId="processing-purpose-select-label"
          label={label}
          value={value === null ? "" : String(value)}
          onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))}
          renderValue={(selected) => {
            const purpose = data.find((item) => item.id === Number(selected));
            return purpose?.name ?? "";
          }}
        >
          {data.map((purpose) => (
            <MenuItem key={purpose.id} value={String(purpose.id)}>
              <Box>
                <Typography sx={{ fontWeight: 600 }}>{purpose.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {purpose.processingPeriod}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
        <FormHelperText>{helperText ?? "Выберите цель из единого реестра целей обработки."}</FormHelperText>
      </FormControl>
      {allowQuickCreate && showQuickCreateButton && (
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setQuickCreateOpen(true)}
          disabled={disabled}
          sx={{ alignSelf: "flex-start" }}
        >
          Создать цель обработки
        </Button>
      )}
      <ProcessingPurposeQuickCreateDialog
        open={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
        onCreated={handleCreated}
      />
    </Stack>
  );
}
