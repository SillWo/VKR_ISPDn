import { zodResolver } from "@hookform/resolvers/zod";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Alert,
  Box,
  Button,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Controller, type FieldPath, useFieldArray, useForm } from "react-hook-form";

import type { IspdnFormValues } from "../../../entities/ispdn/model/types";
import { findFirstInvalidTab, scrollTabContainerToTop } from "../../../shared/lib/tabsValidation";
import { FormSection } from "../../../shared/ui/FormSection";
import { EmployeeSelect } from "../../../shared/ui/employee-select/EmployeeSelect";
import { ispdnCardFormSchema } from "../model/schema";
import { IspdnSecurityToolsSection } from "./IspdnSecurityToolsSection";

const twoLineTabLabelSx = {
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 2,
  overflow: "hidden",
  whiteSpace: "normal",
  lineHeight: 1.25,
  textAlign: "center",
} as const;

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
  onDirtyChange?: (isDirty: boolean) => void;
  onSubmit: (values: IspdnFormValues) => Promise<void> | void;
  onCancel: () => void;
};

export type IspdnCardFormHandle = {
  submit: () => Promise<void>;
  resetToDefaults: () => void;
};

const tabFieldNames: FieldPath<IspdnFormValues>[][] = [
  ["name", "shortDescription", "websiteUrl"],
  ["responsibleEmployeeId", "systemComposition"],
  ["commissioningDate", "decommissioningDate", "status"],
];

export const IspdnCardForm = forwardRef<IspdnCardFormHandle, IspdnCardFormProps>(function IspdnCardForm({
  defaultValues,
  submitLabel,
  isSubmitting,
  legacyResponsiblePerson,
  showActions = true,
  showSecurityTools = true,
  useTabs = false,
  activeTab: controlledActiveTab,
  onActiveTabChange,
  onDirtyChange,
  onSubmit,
  onCancel,
}: IspdnCardFormProps, ref) {
  const [uncontrolledActiveTab, setUncontrolledActiveTab] = useState(0);
  const activeTab = controlledActiveTab ?? uncontrolledActiveTab;
  const {
    control,
    handleSubmit,
    register,
    reset,
    trigger,
    formState: { errors, isDirty },
  } = useForm<IspdnFormValues>({
    resolver: zodResolver(ispdnCardFormSchema),
    defaultValues,
  });
  const {
    fields: systemCompositionFields,
    append: appendSystemCompositionItem,
    remove: removeSystemCompositionItem,
  } = useFieldArray({
    control,
    name: "systemComposition",
  });

  const setActiveTab = (value: number) => {
    if (controlledActiveTab === undefined) {
      setUncontrolledActiveTab(value);
    }
    onActiveTabChange?.(value);
  };

  useEffect(() => {
    scrollTabContainerToTop("ispdn-card-form");
  }, [activeTab]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

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

    setActiveTab(Math.min(activeTab + 1, tabFieldNames.length - 1));
  };

  const submitForm = async (throwOnInvalid = false) => {
    if (useTabs) {
      const firstInvalidTab = await findFirstInvalidTab(trigger, tabFieldNames);
      if (firstInvalidTab >= 0) {
        setActiveTab(firstInvalidTab);
        if (throwOnInvalid) {
          throw new Error("Form contains invalid tab fields");
        }
        return;
      }
    }

    await handleSubmit(async (values) => {
      await onSubmit(values);
      reset(values);
    }, () => {
      if (throwOnInvalid) {
        throw new Error("Form contains invalid fields");
      }
    })();
  };

  useImperativeHandle(ref, () => ({
    submit: () => submitForm(true),
    resetToDefaults: () => reset(defaultValues),
  }));

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

  const systemCompositionErrorMessage =
    typeof errors.systemComposition?.message === "string"
      ? errors.systemComposition.message
      : errors.systemComposition?.root?.message;

  const responsibleFields = (
    <Stack spacing={2}>
      {legacyResponsiblePerson && !defaultValues.responsibleEmployeeId && (
        <Alert severity="warning">
          Ответственный за безопасность ПДн указан старым текстовым значением. Выберите сотрудника из реестра и сохраните карточку.
        </Alert>
      )}
      <Controller
        name="responsibleEmployeeId"
        control={control}
        render={({ field }) => (
          <EmployeeSelect
            value={field.value}
            onChange={field.onChange}
            label={useTabs ? "Ответственный за безопасность ПДн в ИСПДн" : "Ответственный за безопасность ПДн"}
            required
            allowQuickCreate
            quickCreateButtonPlacement="inline"
            disabled={isSubmitting}
            error={Boolean(errors.responsibleEmployeeId)}
            helperText={errors.responsibleEmployeeId?.message}
          />
        )}
      />
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
          <Typography variant="subtitle2" component="h3">
            Состав ИСПДн
          </Typography>
          <Button
            type="button"
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => appendSystemCompositionItem({ name: "", description: "" })}
            disabled={isSubmitting}
            sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
          >
            Добавить элемент
          </Button>
        </Stack>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" sx={{ tableLayout: "fixed" }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: "calc((100% - 96px) / 2)", px: 2.5, py: 2 }}>
                  Наименование
                </TableCell>
                <TableCell sx={{ width: "calc((100% - 96px) / 2)", px: 2.5, py: 2 }}>Описание</TableCell>
                <TableCell align="right" sx={{ width: 96, px: 2.5, py: 2 }}>
                  Действия
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {systemCompositionFields.map((field, index) => (
                <TableRow key={field.id}>
                  <TableCell sx={{ verticalAlign: "top", px: 2.5, py: 2 }}>
                    <TextField
                      fullWidth
                      required
                      multiline
                      minRows={2}
                      label="Наименование"
                      {...register(`systemComposition.${index}.name` as const)}
                      error={Boolean(errors.systemComposition?.[index]?.name)}
                      helperText={errors.systemComposition?.[index]?.name?.message}
                      disabled={isSubmitting}
                    />
                  </TableCell>
                  <TableCell sx={{ verticalAlign: "top", px: 2.5, py: 2 }}>
                    <TextField
                      fullWidth
                      required
                      multiline
                      minRows={2}
                      label="Описание"
                      {...register(`systemComposition.${index}.description` as const)}
                      error={Boolean(errors.systemComposition?.[index]?.description)}
                      helperText={errors.systemComposition?.[index]?.description?.message}
                      disabled={isSubmitting}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ verticalAlign: "top", px: 2.5, py: 2 }}>
                    <IconButton
                      type="button"
                      aria-label="Удалить элемент состава ИСПДн"
                      color="error"
                      disabled={isSubmitting || systemCompositionFields.length <= 1}
                      onClick={() => removeSystemCompositionItem(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {systemCompositionErrorMessage && <FormHelperText error>{systemCompositionErrorMessage}</FormHelperText>}
      </Stack>
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
    <Stack
      id="ispdn-card-form"
      component="form"
      spacing={3}
      onSubmit={(event) => {
        event.preventDefault();
        void submitForm();
      }}
      noValidate
    >
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
            <Tab label={<Box component="span" sx={twoLineTabLabelSx}>Основные сведения</Box>} />
            <Tab label={<Box component="span" sx={twoLineTabLabelSx}>Ответственный</Box>} />
            <Tab label={<Box component="span" sx={twoLineTabLabelSx}>Даты и статус</Box>} />
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
          <FormSection title="Ответственный за безопасность ПДн и состав системы">{responsibleFields}</FormSection>
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
});
