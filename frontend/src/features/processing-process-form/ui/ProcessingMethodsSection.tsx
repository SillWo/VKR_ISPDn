import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
} from "@mui/material";
import { Controller, type Control, type FieldErrors } from "react-hook-form";

import {
  internalNetworkTransferOptions,
  internetTransferOptions,
  processingTypeOptions,
} from "../../../entities/processing-process/model/catalogs";
import type { ProcessingProcessFormValues } from "../../../entities/processing-process/model/types";

type ProcessingMethodsSectionProps = {
  control: Control<ProcessingProcessFormValues>;
  errors: FieldErrors<ProcessingProcessFormValues>;
};

export function ProcessingMethodsSection({ control, errors }: ProcessingMethodsSectionProps) {
  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <Controller
          name="processingType"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth required error={Boolean(errors.processingType)}>
              <InputLabel id="processing-type-label">Тип обработки</InputLabel>
              <Select labelId="processing-type-label" label="Тип обработки" {...field}>
                {processingTypeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>{errors.processingType?.message ?? "Выберите способ обработки ПДн."}</FormHelperText>
            </FormControl>
          )}
        />
        <Controller
          name="internalNetworkTransfer"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth required error={Boolean(errors.internalNetworkTransfer)}>
              <InputLabel id="internal-network-transfer-label">Внутренняя сеть</InputLabel>
              <Select labelId="internal-network-transfer-label" label="Внутренняя сеть" {...field}>
                {internalNetworkTransferOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                {errors.internalNetworkTransfer?.message ?? "Укажите передачу по внутренней сети юридического лица."}
              </FormHelperText>
            </FormControl>
          )}
        />
      </Stack>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <Controller
          name="internetTransfer"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth required error={Boolean(errors.internetTransfer)}>
              <InputLabel id="internet-transfer-label">Внешняя сеть</InputLabel>
              <Select labelId="internet-transfer-label" label="Внешняя сеть" {...field}>
                {internetTransferOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                {errors.internetTransfer?.message ?? "Укажите передачу по сети Интернет."}
              </FormHelperText>
            </FormControl>
          )}
        />
        <Controller
          name="crossBorderTransfer"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth error={Boolean(errors.crossBorderTransfer)}>
              <FormControlLabel
                label="Данные передаются иностранным компаниям, сотрудникам иностранных компаний"
                control={
                  <Switch checked={field.value} onChange={(_, checked) => field.onChange(checked)} />
                }
              />
              <FormHelperText>
                {errors.crossBorderTransfer?.message ?? `Текущее значение: ${field.value ? "Да" : "Нет"}.`}
              </FormHelperText>
            </FormControl>
          )}
        />
      </Stack>
    </Stack>
  );
}
