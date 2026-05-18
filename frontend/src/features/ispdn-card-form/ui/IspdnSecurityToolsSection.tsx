import { Box, Checkbox, FormControlLabel, Stack, TextField, Typography } from "@mui/material";
import { Controller, type Control, type FieldErrors } from "react-hook-form";

import type { IspdnFormValues } from "../../../entities/ispdn/model/types";
import { FormSection } from "../../../shared/ui/FormSection";

const securityToolSwitches = [
  { name: "securityTools.dlp", label: "DLP" },
  { name: "securityTools.siem", label: "SIEM" },
  { name: "securityTools.antivirus", label: "Антивирусные средства" },
  { name: "securityTools.ipsIds", label: "IPS/IDS" },
  { name: "securityTools.firewallUtmNgfw", label: "МЭ, UTM и NGFW" },
  { name: "securityTools.vulnerabilityScanner", label: "Сканер уязвимостей" },
  { name: "securityTools.backupSystem", label: "Система резервного копирования" },
  { name: "securityTools.trustedBoot", label: "Средство доверенной загрузки" },
  { name: "securityTools.accessControl", label: "Средства разграничения доступа" },
  { name: "securityTools.physicalSecurity", label: "СКУД, сигнализация" },
] as const;

type IspdnSecurityToolsSectionProps = {
  control: Control<IspdnFormValues>;
  errors: FieldErrors<IspdnFormValues>;
  isSubmitting?: boolean;
};

export function IspdnSecurityToolsSection({
  control,
  errors,
  isSubmitting,
}: IspdnSecurityToolsSectionProps) {
  return (
    <FormSection title="Средства защиты внутри ИСПДн">
      <Typography color="text.secondary">
        Отметьте средства защиты, которые применяются внутри выбранной ИСПДн. Эти сведения используются при описании
        системы защиты и формировании документов.
      </Typography>
      <Stack spacing={1}>
        {securityToolSwitches.map((item) => (
          <Controller
            key={item.name}
            name={item.name}
            control={control}
            render={({ field }) => (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                  py: 1,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Box sx={{ minWidth: 0 }}>{item.label}</Box>
                <FormControlLabel
                  label={Boolean(field.value) ? "Да" : "Нет"}
                  labelPlacement="start"
                  control={
                    <Checkbox
                      checked={Boolean(field.value)}
                      onChange={(event) => field.onChange(event.target.checked)}
                      disabled={isSubmitting}
                    />
                  }
                  sx={{ m: 0, flexShrink: 0 }}
                />
              </Box>
            )}
          />
        ))}
      </Stack>
      <Controller
        name="securityTools.otherSecurityTools"
        control={control}
        render={({ field }) => (
          <TextField
            label="Иные средства защиты"
            fullWidth
            multiline
            minRows={3}
            value={field.value ?? ""}
            onChange={field.onChange}
            error={Boolean(errors.securityTools?.otherSecurityTools)}
            helperText={errors.securityTools?.otherSecurityTools?.message ?? "Введите дополнительные средства защиты через ;."}
            disabled={isSubmitting}
          />
        )}
      />
    </FormSection>
  );
}
