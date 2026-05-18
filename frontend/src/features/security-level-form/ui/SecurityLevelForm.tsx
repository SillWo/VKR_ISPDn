import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { Controller, useForm } from "react-hook-form";

import { calculateIspdnSecurityLevel } from "../../../entities/security-level/api/securityLevelApi";
import {
  labelByValue,
  securityLevelOptions,
  subjectCountRangeOptions,
  subjectGroupOptions,
  threatTypeOptions,
} from "../../../entities/security-level/model/catalogs";
import type {
  SecurityLevelCalculationPayload,
  SecurityLevelFormValues,
  SecurityLevelRecord,
  SecurityLevelValue,
} from "../../../entities/security-level/model/types";
import { FormSection } from "../../../shared/ui/FormSection";
import { defaultSecurityLevelFormValues, securityLevelFormSchema } from "../model/schema";
import { DataCategorySwitches } from "./DataCategorySwitches";
import { SecurityLevelResultCard } from "./SecurityLevelResultCard";

type SecurityLevelFormProps = {
  ispdnId: number;
  defaultValues?: SecurityLevelFormValues;
  existingRecord?: SecurityLevelRecord | null;
  isSubmitting?: boolean;
  formId?: string;
  showActions?: boolean;
  onSubmit: (values: SecurityLevelFormValues) => void;
};

export function SecurityLevelForm({
  ispdnId,
  defaultValues = defaultSecurityLevelFormValues,
  existingRecord,
  isSubmitting,
  formId,
  showActions = true,
  onSubmit,
}: SecurityLevelFormProps) {
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SecurityLevelFormValues>({
    resolver: zodResolver(securityLevelFormSchema),
    defaultValues,
  });

  const watchedValues = watch();
  const latestCalculationKeyRef = useRef<string | null>(null);
  const calculationPayload = useMemo<SecurityLevelCalculationPayload>(
    () => ({
      dataCategories: watchedValues.dataCategories,
      subjectCountRange: watchedValues.subjectCountRange,
      threatType: watchedValues.threatType,
      subjectGroup: watchedValues.subjectGroup,
    }),
    [
      watchedValues.dataCategories,
      watchedValues.subjectCountRange,
      watchedValues.threatType,
      watchedValues.subjectGroup,
    ],
  );

  const canCalculate =
    Object.values(calculationPayload.dataCategories).some(Boolean) &&
    calculationPayload.subjectCountRange !== "" &&
    calculationPayload.threatType !== "" &&
    calculationPayload.subjectGroup !== "";
  const calculationKey = useMemo(
    () =>
      JSON.stringify({
        dataCategories: calculationPayload.dataCategories,
        subjectCountRange: calculationPayload.subjectCountRange,
        threatType: calculationPayload.threatType,
        subjectGroup: calculationPayload.subjectGroup,
      }),
    [calculationPayload],
  );

  const calculateMutation = useMutation({
    mutationFn: ({ payload }: { payload: SecurityLevelCalculationPayload; key: string }) =>
      calculateIspdnSecurityLevel(ispdnId, payload),
    onSuccess: (result, variables) => {
      if (variables.key !== latestCalculationKeyRef.current) {
        return;
      }
      setValue("recommendedLevel", result.recommendedLevel, { shouldValidate: true });
      setValue("actualLevel", result.recommendedLevel, { shouldValidate: true });
    },
  });

  useEffect(() => {
    if (!canCalculate) {
      latestCalculationKeyRef.current = null;
      setValue("recommendedLevel", null, { shouldValidate: true });
      setValue("actualLevel", "", { shouldValidate: true });
      return;
    }
    latestCalculationKeyRef.current = calculationKey;
    setValue("recommendedLevel", null, { shouldValidate: true });
    setValue("actualLevel", "", { shouldValidate: true });
    calculateMutation.mutate({ payload: calculationPayload, key: calculationKey });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    ispdnId,
    canCalculate,
    calculationPayload.dataCategories.special,
    calculationPayload.dataCategories.biometric,
    calculationPayload.dataCategories.public,
    calculationPayload.dataCategories.other,
    calculationPayload.subjectCountRange,
    calculationPayload.threatType,
    calculationPayload.subjectGroup,
    calculationKey,
  ]);

  const result =
    watchedValues.recommendedLevel === null ? null : calculateMutation.data ?? (existingRecord ?? null);
  const actualDiffers =
    watchedValues.recommendedLevel !== null &&
    watchedValues.actualLevel !== "" &&
    watchedValues.actualLevel !== watchedValues.recommendedLevel;

  return (
    <Stack id={formId} component="form" spacing={3} onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormSection title="Категории данных">
        <DataCategorySwitches control={control} errors={errors} disabled={isSubmitting} />
      </FormSection>

      <FormSection title="Количество субъектов ПДн">
        <Controller
          name="subjectCountRange"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth error={Boolean(errors.subjectCountRange)}>
              <InputLabel id="subject-count-range-label">Количество субъектов ПДн</InputLabel>
              <Select
                labelId="subject-count-range-label"
                label="Количество субъектов ПДн"
                value={field.value}
                onChange={field.onChange}
                disabled={isSubmitting}
              >
                {subjectCountRangeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>{errors.subjectCountRange?.message}</FormHelperText>
            </FormControl>
          )}
        />
      </FormSection>

      <FormSection title="Тип актуальных угроз">
        <Controller
          name="threatType"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth error={Boolean(errors.threatType)}>
              <InputLabel id="threat-type-label">Тип актуальных угроз</InputLabel>
              <Select
                labelId="threat-type-label"
                label="Тип актуальных угроз"
                value={field.value}
                onChange={field.onChange}
                disabled={isSubmitting}
              >
                {threatTypeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>{errors.threatType?.message}</FormHelperText>
            </FormControl>
          )}
        />
      </FormSection>

      <FormSection title="Группы субъектов ПДн">
        <Controller
          name="subjectGroup"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth error={Boolean(errors.subjectGroup)}>
              <InputLabel id="subject-group-label">Группы субъектов ПДн</InputLabel>
              <Select
                labelId="subject-group-label"
                label="Группы субъектов ПДн"
                value={field.value}
                onChange={field.onChange}
                disabled={isSubmitting}
              >
                {subjectGroupOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>{errors.subjectGroup?.message}</FormHelperText>
            </FormControl>
          )}
        />
      </FormSection>

      <SecurityLevelResultCard
        result={result ?? null}
        isCalculating={calculateMutation.isPending}
        error={calculateMutation.isError}
      />

      <FormSection title="Фактический уровень и обоснование">
        <Stack spacing={2}>
          <Controller
            name="actualLevel"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={Boolean(errors.actualLevel)}>
                <InputLabel id="actual-level-label">Фактический уровень защищённости</InputLabel>
                <Select
                  labelId="actual-level-label"
                  label="Фактический уровень защищённости"
                  value={field.value}
                  onChange={(event) => field.onChange(Number(event.target.value) as SecurityLevelValue)}
                  disabled={isSubmitting || watchedValues.recommendedLevel === null}
                >
                  {securityLevelOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  {errors.actualLevel?.message ??
                    (watchedValues.recommendedLevel
                      ? `По умолчанию используется рекомендуемый уровень ${watchedValues.recommendedLevel}.`
                      : "Фактический уровень станет доступен после расчёта.")}
                </FormHelperText>
              </FormControl>
            )}
          />

          {actualDiffers && (
            <Alert severity="warning">
              Фактический уровень отличается от рекомендуемого. Укажите обоснование текстом или приложите файл .pdf /
              .docx.
            </Alert>
          )}

          <Controller
            name="deviationJustificationText"
            control={control}
            render={({ field }) => (
              <TextField
                label="Текстовое обоснование изменения уровня"
                fullWidth
                multiline
                minRows={4}
                value={field.value}
                onChange={field.onChange}
                disabled={isSubmitting}
                error={Boolean(errors.deviationJustificationText)}
                helperText={errors.deviationJustificationText?.message ?? "Заполняется только при отличии уровней."}
              />
            )}
          />

          <Controller
            name="deviationJustificationFile"
            control={control}
            render={({ field }) => (
              <Stack spacing={1}>
                <Button variant="outlined" component="label" disabled={isSubmitting}>
                  Выбрать файл .pdf / .docx
                  <input
                    hidden
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(event) => field.onChange(event.target.files?.[0] ?? null)}
                  />
                </Button>
                <Typography variant="body2" color={field.value ? "text.primary" : "text.secondary"}>
                  {field.value?.name ??
                    existingRecord?.deviationJustificationFileName ??
                    "Файл обоснования не выбран"}
                </Typography>
                {errors.deviationJustificationFile?.message && (
                  <FormHelperText error>{errors.deviationJustificationFile.message}</FormHelperText>
                )}
              </Stack>
            )}
          />

          {watchedValues.actualLevel && watchedValues.recommendedLevel && !actualDiffers && (
            <Alert severity="success">
              Фактический уровень совпадает с рекомендуемым:{" "}
              {labelByValue(securityLevelOptions, watchedValues.actualLevel)}.
            </Alert>
          )}
        </Stack>
      </FormSection>

      {showActions && (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "flex-end" }}>
          <Button type="submit" variant="contained" disabled={isSubmitting || watchedValues.recommendedLevel === null}>
            {isSubmitting ? "Сохранение..." : "Сохранить"}
          </Button>
        </Stack>
      )}
    </Stack>
  );
}
