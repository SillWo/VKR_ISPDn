import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Stack, TextField } from "@mui/material";
import { forwardRef, useImperativeHandle } from "react";
import { Controller, useForm } from "react-hook-form";

import {
  legalBasisCatalog,
  mergeDataCategoryValues,
  mergePersonalDataActionValues,
  mergeSwitchValues,
  personalDataActionCatalog,
  subjectCategoryCatalog,
} from "../../../entities/processing-process/model/catalogs";
import type { ProcessingProcessFormValues } from "../../../entities/processing-process/model/types";
import { ProcessingPurposeSelect } from "../../../shared/ui/processing-purpose-select/ProcessingPurposeSelect";
import { FormSection } from "../../../shared/ui/FormSection";
import { processingProcessFormSchema } from "../model/schema";
import { DataCategoriesSection } from "./DataCategoriesSection";
import { ProcessingMethodsSection } from "./ProcessingMethodsSection";
import { SwitchCatalogSection } from "./SwitchCatalogSection";

type ProcessingProcessFormProps = {
  defaultValues: ProcessingProcessFormValues;
  submitLabel: string;
  isSubmitting?: boolean;
  showActions?: boolean;
  onSubmit: (values: ProcessingProcessFormValues) => void;
  onCancel: () => void;
};

export type ProcessingProcessFormHandle = {
  validate: () => Promise<ProcessingProcessFormValues | null>;
};

export const ProcessingProcessForm = forwardRef<ProcessingProcessFormHandle, ProcessingProcessFormProps>(function ProcessingProcessForm({
  defaultValues,
  submitLabel,
  isSubmitting,
  showActions = true,
  onSubmit,
  onCancel,
}: ProcessingProcessFormProps, ref) {
  const {
    control,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<ProcessingProcessFormValues>({
    resolver: zodResolver(processingProcessFormSchema),
    defaultValues: {
      ...defaultValues,
      subjectCategories: mergeSwitchValues(subjectCategoryCatalog, defaultValues.subjectCategories),
      dataCategories: mergeDataCategoryValues(defaultValues.dataCategories),
      legalBases: mergeSwitchValues(legalBasisCatalog, defaultValues.legalBases),
      personalDataActions: mergePersonalDataActionValues(defaultValues.personalDataActions),
    },
  });

  useImperativeHandle(ref, () => ({
    validate: async () => {
      const isValid = await trigger();
      return isValid ? getValues() : null;
    },
  }));

  return (
    <Stack component="form" spacing={3} onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormSection title="Цель обработки">
        <Controller
          name="processingPurposeId"
          control={control}
          render={({ field }) => (
            <ProcessingPurposeSelect
              value={field.value}
              onChange={field.onChange}
              required
              allowQuickCreate
              disabled={isSubmitting}
              error={Boolean(errors.processingPurposeId)}
              helperText={errors.processingPurposeId?.message ?? "Процесс должен ссылаться на цель из реестра."}
            />
          )}
        />
      </FormSection>

      <FormSection title="Категории субъектов">
        <SwitchCatalogSection
          catalog={subjectCategoryCatalog}
          fieldName="subjectCategories"
          control={control}
          errors={errors}
        />
      </FormSection>

      <FormSection title="Категории данных">
        <DataCategoriesSection control={control} errors={errors} />
      </FormSection>

      <FormSection title="Основания обработки">
        <SwitchCatalogSection
          catalog={legalBasisCatalog}
          fieldName="legalBases"
          control={control}
          errors={errors}
        />
      </FormSection>

      <FormSection title="Действия с ПДн">
        <SwitchCatalogSection
          catalog={personalDataActionCatalog.filter((item) => item.key !== "other_actions")}
          fieldName="personalDataActions"
          control={control}
          errors={errors}
        />
        <Controller
          name="personalDataActions.other_actions"
          control={control}
          render={({ field }) => (
            <TextField
              label="Иные действия"
              fullWidth
              multiline
              minRows={2}
              value={typeof field.value === "string" ? field.value : ""}
              onChange={field.onChange}
              helperText="Заполните, если действие не входит в стандартный перечень."
            />
          )}
        />
      </FormSection>

      <FormSection title="Способы обработки">
        <ProcessingMethodsSection control={control} errors={errors} />
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
});
