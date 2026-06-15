import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, Stack, Tab, Tabs, TextField } from "@mui/material";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Controller, type FieldPath, useForm } from "react-hook-form";

import {
  legalBasisCatalog,
  mergeDataCategoryValues,
  mergePersonalDataActionValues,
  mergeSwitchValues,
  personalDataActionCatalog,
  subjectCategoryCatalog,
} from "../../../entities/processing-process/model/catalogs";
import type { ProcessingProcessFormValues } from "../../../entities/processing-process/model/types";
import { findFirstInvalidTab, scrollTabContainerToTop } from "../../../shared/lib/tabsValidation";
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
  onSubmit: (values: ProcessingProcessFormValues) => Promise<void> | void;
  onCancel: () => void;
};

export type ProcessingProcessFormHandle = {
  validate: () => Promise<ProcessingProcessFormValues | null>;
};

const tabFieldNames: FieldPath<ProcessingProcessFormValues>[][] = [
  ["purposeName", "processingPeriod", "subjectCategories", "legalBases"],
  ["dataCategories"],
  ["personalDataActions", "processingType", "internalNetworkTransfer", "internetTransfer", "crossBorderTransfer"],
];

export const ProcessingProcessForm = forwardRef<ProcessingProcessFormHandle, ProcessingProcessFormProps>(
  function ProcessingProcessForm(
    {
      defaultValues,
      submitLabel,
      isSubmitting,
      showActions = true,
      onSubmit,
      onCancel,
    }: ProcessingProcessFormProps,
    ref,
  ) {
    const [activeTab, setActiveTab] = useState(0);
    const {
      control,
      handleSubmit,
      register,
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
        const firstInvalidTab = await findFirstInvalidTab(trigger, tabFieldNames);
        if (firstInvalidTab >= 0) {
          setActiveTab(firstInvalidTab);
          return null;
        }
        return getValues();
      },
    }));

    useEffect(() => {
      scrollTabContainerToTop("processing-process-form");
    }, [activeTab]);

    const handleNextTab = async () => {
      const isValid = await trigger(tabFieldNames[activeTab], { shouldFocus: true });
      if (!isValid) {
        return;
      }

      const firstInvalidTab = await findFirstInvalidTab(trigger, tabFieldNames);
      if (firstInvalidTab >= 0) {
        setActiveTab(firstInvalidTab);
        return;
      }

      setActiveTab((current) => Math.min(current + 1, tabFieldNames.length - 1));
    };

    const handleFormSubmit = async () => {
      const firstInvalidTab = await findFirstInvalidTab(trigger, tabFieldNames);
      if (firstInvalidTab >= 0) {
        setActiveTab(firstInvalidTab);
        return;
      }

      await handleSubmit(onSubmit)();
    };

    return (
      <Stack
        id="processing-process-form"
        component="form"
        spacing={3}
        onSubmit={(event) => {
          event.preventDefault();
          void handleFormSubmit();
        }}
        noValidate
      >
        <Tabs
          value={activeTab}
          onChange={(_, value: number) => setActiveTab(value)}
          variant="scrollable"
          allowScrollButtonsMobile
          sx={{
            borderBottom: "1px solid",
            borderColor: "divider",
            "& .MuiTab-root": { whiteSpace: "normal", lineHeight: 1.25, minHeight: 48 },
          }}
        >
          <Tab label="Основные сведения процесса" />
          <Tab label="Обрабатываемые персональные данные" />
          <Tab label="Действия с ПДн" />
        </Tabs>

        <Box>
          {activeTab === 0 && (
            <Stack spacing={3}>
              <FormSection title="Основные сведения процесса">
                <TextField
                  label="Цель обработки"
                  fullWidth
                  required
                  disabled={isSubmitting}
                  {...register("purposeName")}
                  error={Boolean(errors.purposeName)}
                  helperText={
                    errors.purposeName?.message ??
                    "Цель обработки используется как наименование процесса во всех реестрах и документах."
                  }
                />
                <TextField
                  label="Период обработки"
                  fullWidth
                  required
                  disabled={isSubmitting}
                  {...register("processingPeriod")}
                  error={Boolean(errors.processingPeriod)}
                  helperText={errors.processingPeriod?.message ?? "Например: до достижения цели обработки или 5 лет."}
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

              <FormSection title="Правовые основания обработки">
                <SwitchCatalogSection
                  catalog={legalBasisCatalog}
                  fieldName="legalBases"
                  control={control}
                  errors={errors}
                />
              </FormSection>
            </Stack>
          )}

          {activeTab === 1 && (
            <FormSection title="Обрабатываемые персональные данные">
              <DataCategoriesSection
                control={control}
                errors={errors}
                groupTitles={[
                  "Персональные данные",
                  "Специальные категории персональных данных",
                  "Биометрические персональные данные",
                ]}
              />
            </FormSection>
          )}

          {activeTab === 2 && (
            <Stack spacing={3}>
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
            </Stack>
          )}
        </Box>

        {showActions && (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "flex-start" }}>
            <Button
              type="button"
              variant="outlined"
              onClick={() => setActiveTab((current) => Math.max(current - 1, 0))}
              disabled={isSubmitting || activeTab === 0}
            >
              Назад
            </Button>
            {activeTab < tabFieldNames.length - 1 ? (
              <Button type="button" variant="contained" disabled={isSubmitting} onClick={handleNextTab}>
                Далее
              </Button>
            ) : (
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {isSubmitting ? "Сохранение..." : submitLabel}
              </Button>
            )}
            <Button variant="text" onClick={onCancel} disabled={isSubmitting}>
              Отмена
            </Button>
          </Stack>
        )}
      </Stack>
    );
  },
);
