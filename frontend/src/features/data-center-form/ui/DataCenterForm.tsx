import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";

import type { DataCenterFormValues } from "../../../entities/data-center/model/types";
import { FormSection } from "../../../shared/ui/FormSection";
import { dataCenterFormSchema, dataCenterOwnerTypeLabels } from "../model/schema";

type DataCenterFormProps = {
  defaultValues: DataCenterFormValues;
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (values: DataCenterFormValues) => void;
  onCancel: () => void;
};

export function DataCenterForm({
  defaultValues,
  submitLabel,
  isSubmitting,
  onSubmit,
  onCancel,
}: DataCenterFormProps) {
  const {
    control,
    handleSubmit,
    register,
    watch,
    formState: { errors },
  } = useForm<DataCenterFormValues>({
    resolver: zodResolver(dataCenterFormSchema),
    defaultValues,
  });

  const isOwnDataCenter = watch("isOwnDataCenter");
  const ownerOrganizationType = watch("ownerOrganizationType");

  return (
    <Stack component="form" spacing={3} onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormSection title="Основные сведения о ЦОД">
        <TextField
          label="Название"
          fullWidth
          required
          {...register("name")}
          error={Boolean(errors.name)}
          helperText={errors.name?.message ?? "Укажите рабочее название ЦОД."}
        />
        <TextField
          label="Страна расположения"
          fullWidth
          required
          {...register("locationCountry")}
          error={Boolean(errors.locationCountry)}
          helperText={errors.locationCountry?.message}
        />
        <TextField
          label="Адрес местонахождения"
          fullWidth
          required
          multiline
          minRows={2}
          {...register("locationAddress")}
          error={Boolean(errors.locationAddress)}
          helperText={errors.locationAddress?.message}
        />
        <Controller
          name="isOwnDataCenter"
          control={control}
          render={({ field }) => (
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={field.value}
                    onChange={(_, checked) => field.onChange(checked)}
                    disabled={isSubmitting}
                  />
                }
                label="Собственный ЦОД"
              />
              <Typography variant="body2" color="text.secondary">
                Если ЦОД собственный, сведения об организации-владельце не заполняются.
              </Typography>
            </Box>
          )}
        />
      </FormSection>

      {!isOwnDataCenter && (
        <FormSection title="Организация, ответственная за хранение данных">
          <Controller
            name="ownerOrganizationType"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth required error={Boolean(errors.ownerOrganizationType)}>
                <InputLabel id="owner-organization-type-label">Тип организации</InputLabel>
                <Select
                  labelId="owner-organization-type-label"
                  label="Тип организации"
                  value={field.value}
                  onChange={(event) => field.onChange(event.target.value)}
                  disabled={isSubmitting}
                >
                  <MenuItem value="individual">{dataCenterOwnerTypeLabels.individual}</MenuItem>
                  <MenuItem value="foreign_organization">
                    {dataCenterOwnerTypeLabels.foreign_organization}
                  </MenuItem>
                  <MenuItem value="individual_entrepreneur">
                    {dataCenterOwnerTypeLabels.individual_entrepreneur}
                  </MenuItem>
                  <MenuItem value="legal_entity">{dataCenterOwnerTypeLabels.legal_entity}</MenuItem>
                </Select>
                <FormHelperText>
                  {errors.ownerOrganizationType?.message ?? "Выберите тип владельца или ответственной организации."}
                </FormHelperText>
              </FormControl>
            )}
          />

          {(ownerOrganizationType === "individual" || ownerOrganizationType === "individual_entrepreneur") && (
            <TextField
              label="ФИО"
              fullWidth
              required
              {...register("ownerPersonFullName")}
              error={Boolean(errors.ownerPersonFullName)}
              helperText={errors.ownerPersonFullName?.message}
            />
          )}

          {(ownerOrganizationType === "legal_entity" || ownerOrganizationType === "foreign_organization") && (
            <TextField
              label="Наименование организации"
              fullWidth
              required
              {...register("ownerOrganizationName")}
              error={Boolean(errors.ownerOrganizationName)}
              helperText={errors.ownerOrganizationName?.message}
            />
          )}

          {ownerOrganizationType === "individual_entrepreneur" && (
            <TextField
              label="ОГРНИП"
              fullWidth
              required
              {...register("ownerOgrnip")}
              error={Boolean(errors.ownerOgrnip)}
              helperText={errors.ownerOgrnip?.message}
            />
          )}

          {ownerOrganizationType === "legal_entity" && (
            <TextField
              label="ОГРН"
              fullWidth
              required
              {...register("ownerOgrn")}
              error={Boolean(errors.ownerOgrn)}
              helperText={errors.ownerOgrn?.message}
            />
          )}

          {(ownerOrganizationType === "individual" ||
            ownerOrganizationType === "individual_entrepreneur" ||
            ownerOrganizationType === "legal_entity") && (
            <TextField
              label="ИНН"
              fullWidth
              required
              {...register("ownerInn")}
              error={Boolean(errors.ownerInn)}
              helperText={errors.ownerInn?.message}
            />
          )}

          <TextField
            label="Страна местонахождения организации, ответственной за хранение данных"
            fullWidth
            required
            {...register("ownerLocationCountry")}
            error={Boolean(errors.ownerLocationCountry)}
            helperText={errors.ownerLocationCountry?.message}
          />
          <TextField
            label="Адрес местонахождения организации, ответственной за хранение данных"
            fullWidth
            required
            multiline
            minRows={2}
            {...register("ownerLocationAddress")}
            error={Boolean(errors.ownerLocationAddress)}
            helperText={errors.ownerLocationAddress?.message}
          />
        </FormSection>
      )}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "flex-end" }}>
        <Button variant="outlined" onClick={onCancel} disabled={isSubmitting}>
          Отмена
        </Button>
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? "Сохранение..." : submitLabel}
        </Button>
      </Stack>
    </Stack>
  );
}
