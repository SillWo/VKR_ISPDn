import { zodResolver } from "@hookform/resolvers/zod";
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
  Switch,
  TextField,
} from "@mui/material";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";

import type { IspdnFormValues } from "../../../entities/ispdn/model/types";
import { FormSection } from "../../../shared/ui/FormSection";
import { EmployeeSelect } from "../../../shared/ui/employee-select/EmployeeSelect";
import { ispdnCardFormSchema, ispdnCardMainInfoFormSchema } from "../model/schema";
import { IspdnProcessingPurposesField } from "./IspdnProcessingPurposesField";

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

type IspdnCardFormProps = {
  defaultValues: IspdnFormValues;
  submitLabel: string;
  isSubmitting?: boolean;
  legacyResponsiblePerson?: string | null;
  showActions?: boolean;
  showProcessingPurposes?: boolean;
  showSecurityTools?: boolean;
  onSubmit: (values: IspdnFormValues) => void;
  onCancel: () => void;
};

export function IspdnCardForm({
  defaultValues,
  submitLabel,
  isSubmitting,
  legacyResponsiblePerson,
  showActions = true,
  showProcessingPurposes = true,
  showSecurityTools = true,
  onSubmit,
  onCancel,
}: IspdnCardFormProps) {
  const schema = useMemo(
    () => (showProcessingPurposes ? ispdnCardFormSchema : ispdnCardMainInfoFormSchema),
    [showProcessingPurposes],
  );

  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<IspdnFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <Stack id="ispdn-card-form" component="form" spacing={3} onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormSection title="Основные сведения">
        <TextField
          label="Название ИСПДн"
          fullWidth
          required
          {...register("name")}
          error={Boolean(errors.name)}
          helperText={errors.name?.message ?? "Укажите рабочее название информационной системы."}
        />
        <TextField
          label="Краткое описание"
          fullWidth
          required
          multiline
          minRows={3}
          {...register("shortDescription")}
          error={Boolean(errors.shortDescription)}
          helperText={errors.shortDescription?.message ?? "Опишите назначение системы и основной контур обработки."}
        />
        {showProcessingPurposes && (
          <Controller
            name="processingPurposeIds"
            control={control}
            render={({ field }) => (
              <IspdnProcessingPurposesField
                value={field.value}
                onChange={field.onChange}
                disabled={isSubmitting}
                error={Boolean(errors.processingPurposeIds)}
                helperText={errors.processingPurposeIds?.message ?? "Цели обработки выбираются из единого реестра."}
              />
            )}
          />
        )}
        <TextField
          label="Сайт ИСПДн"
          fullWidth
          {...register("websiteUrl")}
          error={Boolean(errors.websiteUrl)}
          helperText={errors.websiteUrl?.message ?? "Необязательное поле. Например: https://example.ru"}
        />
      </FormSection>

      <FormSection title="Ответственный и состав системы">
        {legacyResponsiblePerson && !defaultValues.responsibleEmployeeId && (
          <Alert severity="warning">
            Ответственный указан старым текстовым значением. Выберите сотрудника из реестра и сохраните карточку.
          </Alert>
        )}
        <Controller
          name="responsibleEmployeeId"
          control={control}
          render={({ field }) => (
            <EmployeeSelect
              value={field.value}
              onChange={field.onChange}
              label="Ответственный за обработку ПДн"
              required
              allowQuickCreate
              quickCreateButtonPlacement="inline"
              disabled={isSubmitting}
              error={Boolean(errors.responsibleEmployeeId)}
              helperText={
                errors.responsibleEmployeeId?.message ??
                "Выберите сотрудника, ответственного за обработку ПДн в этой ИСПДн."
              }
            />
          )}
        />
        <TextField
          label="Состав ИСПДн"
          fullWidth
          required
          multiline
          minRows={4}
          {...register("systemComposition")}
          error={Boolean(errors.systemComposition)}
          helperText={errors.systemComposition?.message ?? "Опишите приложения, базу данных, серверы и компоненты системы."}
        />
      </FormSection>

      {showSecurityTools && (
        <FormSection title="Средства защиты внутри ИСПДн">
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
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexShrink: 0 }}>
                      <Box component="span" sx={{ color: field.value ? "text.secondary" : "text.primary" }}>
                        Нет
                      </Box>
                      <Switch
                        checked={Boolean(field.value)}
                        onChange={(_, checked) => field.onChange(checked)}
                        disabled={isSubmitting}
                      />
                      <Box component="span" sx={{ color: field.value ? "text.primary" : "text.secondary" }}>
                        Да
                      </Box>
                    </Stack>
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
                helperText={
                  errors.securityTools?.otherSecurityTools?.message ?? "Введите дополнительные средства защиты через ;."
                }
              />
            )}
          />
        </FormSection>
      )}

      <FormSection title="Даты и статус">
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            label="Дата ввода в работу"
            type="date"
            fullWidth
            required
            slotProps={{ inputLabel: { shrink: true } }}
            {...register("commissioningDate")}
            error={Boolean(errors.commissioningDate)}
            helperText={errors.commissioningDate?.message ?? "Дата начала эксплуатации ИСПДн."}
          />
          <TextField
            label="Дата вывода из работы"
            type="date"
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
            {...register("decommissioningDate")}
            error={Boolean(errors.decommissioningDate)}
            helperText={errors.decommissioningDate?.message ?? "Заполняется, если система выведена или планируется к выводу."}
          />
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={Boolean(errors.status)}>
                <InputLabel id="ispdn-status-label">Статус</InputLabel>
                <Select labelId="ispdn-status-label" label="Статус" {...field}>
                  <MenuItem value="active">Работает</MenuItem>
                  <MenuItem value="archived">Архив</MenuItem>
                </Select>
                <FormHelperText>{errors.status?.message ?? "Текущий статус карточки в реестре."}</FormHelperText>
              </FormControl>
            )}
          />
        </Stack>
      </FormSection>

      {showActions && (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "flex-end" }}>
          <Button variant="outlined" onClick={onCancel} disabled={isSubmitting}>
            Отмена
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? "Сохранение..." : submitLabel}
          </Button>
        </Stack>
      )}
    </Stack>
  );
}
