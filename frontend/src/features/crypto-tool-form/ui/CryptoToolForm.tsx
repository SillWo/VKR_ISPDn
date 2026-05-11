import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { Controller, type Resolver, useForm } from "react-hook-form";

import type { CryptoToolFormValues } from "../../../entities/crypto-tool/model/types";
import { FormSection } from "../../../shared/ui/FormSection";
import { cryptoToolClassOptions, cryptoToolFormSchema } from "../model/schema";

type CryptoToolFormProps = {
  defaultValues: CryptoToolFormValues;
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (values: CryptoToolFormValues) => void;
  onCancel: () => void;
};

export function CryptoToolForm({
  defaultValues,
  submitLabel,
  isSubmitting,
  onSubmit,
  onCancel,
}: CryptoToolFormProps) {
  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<CryptoToolFormValues>({
    resolver: zodResolver(cryptoToolFormSchema) as Resolver<CryptoToolFormValues>,
    defaultValues,
  });

  return (
    <Stack component="form" spacing={3} onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormSection title="Сведения о СКЗИ">
        <TextField
          label="Наименование"
          fullWidth
          required
          disabled={isSubmitting}
          {...register("name")}
          error={Boolean(errors.name)}
          helperText={errors.name?.message}
        />
        <Controller
          name="cryptoClass"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth required error={Boolean(errors.cryptoClass)} disabled={isSubmitting}>
              <InputLabel id="crypto-tool-class-label">Класс</InputLabel>
              <Select
                labelId="crypto-tool-class-label"
                label="Класс"
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
              >
                {cryptoToolClassOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>{errors.cryptoClass?.message}</FormHelperText>
            </FormControl>
          )}
        />
        <TextField
          label="Изготовитель"
          fullWidth
          required
          disabled={isSubmitting}
          {...register("manufacturer")}
          error={Boolean(errors.manufacturer)}
          helperText={errors.manufacturer?.message}
        />
        <TextField
          label="Серийный номер"
          fullWidth
          required
          disabled={isSubmitting}
          {...register("serialNumber")}
          error={Boolean(errors.serialNumber)}
          helperText={errors.serialNumber?.message}
        />
      </FormSection>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "flex-end" }}>
        <Button type="button" variant="outlined" onClick={onCancel} disabled={isSubmitting}>
          Отмена
        </Button>
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? "Сохранение..." : submitLabel}
        </Button>
      </Stack>
    </Stack>
  );
}
