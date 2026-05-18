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
  Tab,
  Tabs,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Controller, type FieldPath, useForm } from "react-hook-form";

import type { IspdnFormValues } from "../../../entities/ispdn/model/types";
import { FormSection } from "../../../shared/ui/FormSection";
import { EmployeeSelect } from "../../../shared/ui/employee-select/EmployeeSelect";
import { ispdnCardFormSchema } from "../model/schema";
import { IspdnSecurityToolsSection } from "./IspdnSecurityToolsSection";

type IspdnCardFormProps = {
  defaultValues: IspdnFormValues;
  submitLabel: string;
  isSubmitting?: boolean;
  legacyResponsiblePerson?: string | null;
  showActions?: boolean;
  showSecurityTools?: boolean;
  useTabs?: boolean;
  activeTab?: number;
  onActiveTabChange?: (activeTab: number) => void;
  onSubmit: (values: IspdnFormValues) => void;
  onCancel: () => void;
};

const tabFieldNames: FieldPath<IspdnFormValues>[][] = [
  ["name", "shortDescription", "websiteUrl"],
  ["responsibleEmployeeId", "systemComposition"],
  ["commissioningDate", "decommissioningDate", "status"],
];

export function IspdnCardForm({
  defaultValues,
  submitLabel,
  isSubmitting,
  legacyResponsiblePerson,
  showActions = true,
  showSecurityTools = true,
  useTabs = false,
  activeTab: controlledActiveTab,
  onActiveTabChange,
  onSubmit,
  onCancel,
}: IspdnCardFormProps) {
  const [uncontrolledActiveTab, setUncontrolledActiveTab] = useState(0);
  const activeTab = controlledActiveTab ?? uncontrolledActiveTab;
  const {
    control,
    handleSubmit,
    register,
    trigger,
    formState: { errors },
  } = useForm<IspdnFormValues>({
    resolver: zodResolver(ispdnCardFormSchema),
    defaultValues,
  });

  const setActiveTab = (value: number) => {
    if (controlledActiveTab === undefined) {
      setUncontrolledActiveTab(value);
    }
    onActiveTabChange?.(value);
  };

  useEffect(() => {
    document.getElementById("ispdn-card-form")?.scrollIntoView({ block: "start" });
  }, [activeTab]);

  const handleNextTab = async () => {
    const isValid = await trigger(tabFieldNames[activeTab], { shouldFocus: true });
    if (isValid) {
      setActiveTab(Math.min(activeTab + 1, tabFieldNames.length - 1));
    }
  };

  const basicFields = (
    <Stack spacing={2}>
      <TextField
        label="Название ИСПДн"
        fullWidth
        required
        {...register("name")}
        error={Boolean(errors.name)}
        helperText={errors.name?.message}
      />
      <TextField
        label="Краткое описание"
        fullWidth
        required
        multiline
        minRows={3}
        {...register("shortDescription")}
        error={Boolean(errors.shortDescription)}
        helperText={errors.shortDescription?.message}
      />
      <TextField
        label="Сайт ИСПДн"
        fullWidth
        {...register("websiteUrl")}
        error={Boolean(errors.websiteUrl)}
        helperText={errors.websiteUrl?.message}
      />
    </Stack>
  );

  const responsibleFields = (
    <Stack spacing={2}>
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
            helperText={errors.responsibleEmployeeId?.message}
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
        helperText={errors.systemComposition?.message}
      />
    </Stack>
  );

  const dateFields = (
    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
      <TextField
        label="Дата ввода в работу"
        type="date"
        fullWidth
        required
        slotProps={{ inputLabel: { shrink: true } }}
        {...register("commissioningDate")}
        error={Boolean(errors.commissioningDate)}
        helperText={errors.commissioningDate?.message}
      />
      <TextField
        label="Дата вывода из работы"
        type="date"
        fullWidth
        slotProps={{ inputLabel: { shrink: true } }}
        {...register("decommissioningDate")}
        error={Boolean(errors.decommissioningDate)}
        helperText={errors.decommissioningDate?.message}
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
            <FormHelperText>{errors.status?.message}</FormHelperText>
          </FormControl>
        )}
      />
    </Stack>
  );

  return (
    <Stack id="ispdn-card-form" component="form" spacing={3} onSubmit={handleSubmit(onSubmit)} noValidate>
      {useTabs ? (
        <Stack spacing={3}>
          <Tabs
            value={activeTab}
            onChange={(_, value: number) => setActiveTab(value)}
            variant="scrollable"
            allowScrollButtonsMobile
            sx={{
              borderBottom: "1px solid",
              borderColor: "divider",
              "& .MuiTab-root": {
                minHeight: 48,
                maxWidth: 220,
                whiteSpace: "normal",
                lineHeight: 1.25,
              },
            }}
          >
            <Tab label="Основные сведения" />
            <Tab label="Ответственный и состав системы" />
            <Tab label="Даты и статус" />
          </Tabs>
          <Box sx={{ p: { xs: 0, sm: 1 } }}>
            {activeTab === 0 && basicFields}
            {activeTab === 1 && responsibleFields}
            {activeTab === 2 && dateFields}
          </Box>
          {!showActions && activeTab < tabFieldNames.length - 1 && (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "flex-start" }}>
              <Button
                type="button"
                variant="outlined"
                disabled={isSubmitting || activeTab === 0}
                onClick={() => setActiveTab(Math.max(activeTab - 1, 0))}
              >
                Назад
              </Button>
              <Button type="button" variant="contained" disabled={isSubmitting} onClick={handleNextTab}>
                Далее
              </Button>
            </Stack>
          )}
        </Stack>
      ) : (
        <>
          <FormSection title="Основные сведения">{basicFields}</FormSection>
          <FormSection title="Ответственный и состав системы">{responsibleFields}</FormSection>
        </>
      )}

      {showSecurityTools && (
        <IspdnSecurityToolsSection control={control} errors={errors} isSubmitting={isSubmitting} />
      )}

      {!useTabs && <FormSection title="Даты и статус">{dateFields}</FormSection>}

      {showActions && (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "flex-start" }}>
          {useTabs && (
            <Button
              type="button"
              variant="outlined"
              disabled={isSubmitting || activeTab === 0}
              onClick={() => setActiveTab(Math.max(activeTab - 1, 0))}
            >
              Назад
            </Button>
          )}
          {useTabs && activeTab < tabFieldNames.length - 1 ? (
            <Button type="button" variant="contained" disabled={isSubmitting} onClick={handleNextTab}>
              Далее
            </Button>
          ) : (
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? "Сохранение..." : submitLabel}
            </Button>
          )}
          <Button variant={useTabs ? "text" : "outlined"} onClick={onCancel} disabled={isSubmitting}>
            Отмена
          </Button>
        </Stack>
      )}
    </Stack>
  );
}
