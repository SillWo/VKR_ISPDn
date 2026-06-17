import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Autocomplete,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Controller, type Resolver, useFieldArray, useForm, useWatch } from "react-hook-form";

import { getEmployeeOptions } from "../../../entities/employee/api/employeeApi";
import { okvedOptions, type OkvedOption } from "../../../entities/okved/model/okved2";
import type { OrganizationFormValues } from "../../../entities/organization/model/types";
import { FormSection } from "../../../shared/ui/FormSection";
import { EmployeeSelect } from "../../../shared/ui/employee-select/EmployeeSelect";
import { organizationCardFormSchema } from "../model/schema";

const operatorTypeOptions = [
  { value: "", label: "Не выбран" },
  { value: "legal_entity", label: "Юридическое лицо" },
  { value: "individual_entrepreneur", label: "Индивидуальный предприниматель" },
  { value: "state_body", label: "Государственный орган" },
  { value: "municipal_body", label: "Муниципальный орган" },
] as const;

const identityDocumentTypeOptions = [
  { value: "passport_rf", label: "Паспорт гражданина РФ" },
  { value: "other_rf_document", label: "Другой документ гражданина РФ" },
] as const;

const terminationTypeOptions = [
  { value: "end_date", label: "Дата окончания" },
  { value: "end_condition", label: "Условие окончания" },
] as const;

const MAX_OKVED_RESULTS = 50;
const okvedOptionCodes = new Set(okvedOptions.map((option) => option.code));

function getOkvedLabel(option: OkvedOption) {
  const suffix = okvedOptionCodes.has(option.code) ? "" : " (нет в справочнике)";
  return `${option.code} — ${option.name}${suffix}`;
}

function filterOkvedOptions(options: OkvedOption[], query: string) {
  const normalizedQueryText = query.toLowerCase().trim().replace(/\s+/g, " ");
  const normalizedQueryCode = query.replace(/\D/g, "");
  const queryWords = normalizedQueryText.split(" ").filter(Boolean);

  if (!normalizedQueryText && !normalizedQueryCode) {
    return options.slice(0, MAX_OKVED_RESULTS);
  }

  return options
    .filter((option) => {
      const optionCode = option.code.replace(/\D/g, "");
      const optionText = `${option.code} ${option.name}`.toLowerCase();
      const optionName = option.name.toLowerCase();

      return (
        option.code.toLowerCase().includes(normalizedQueryText) ||
        Boolean(normalizedQueryCode && optionCode.includes(normalizedQueryCode)) ||
        optionName.includes(normalizedQueryText) ||
        queryWords.every((word) => optionText.includes(word))
      );
    })
    .slice(0, MAX_OKVED_RESULTS);
}

function getOkvedErrorMessage(error: unknown): string | undefined {
  if (!error) {
    return undefined;
  }
  if (Array.isArray(error)) {
    for (const item of error) {
      const fieldError = item as { code?: { message?: unknown }; name?: { message?: unknown } } | undefined;
      const message = fieldError?.code?.message ?? fieldError?.name?.message;
      if (typeof message === "string") {
        return message;
      }
    }
    return undefined;
  }

  const message = (error as { message?: unknown }).message;
  return typeof message === "string" ? message : undefined;
}

type OrganizationCardFormProps = {
  defaultValues: OrganizationFormValues;
  isSubmitting?: boolean;
  submitLabel?: string;
  onSubmit: (values: OrganizationFormValues) => void;
};

function formatPhoneInput(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("7")) {
    digits = digits.slice(1);
  } else if (digits.startsWith("8")) {
    digits = digits.slice(1);
  }
  digits = digits.slice(0, 10);
  if (!digits) {
    return "";
  }
  const first = digits.slice(0, 3);
  const second = digits.slice(3, 6);
  const third = digits.slice(6, 8);
  const fourth = digits.slice(8, 10);
  let formatted = `+7(${first}`;
  if (first.length === 3) {
    formatted += ")";
  }
  if (second) {
    formatted += second;
  }
  if (third) {
    formatted += `-${third}`;
  }
  if (fourth) {
    formatted += `-${fourth}`;
  }
  return formatted;
}

export function OrganizationCardForm({
  defaultValues,
  isSubmitting,
  submitLabel = "Сохранить",
  onSubmit,
}: OrganizationCardFormProps) {
  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationCardFormSchema) as Resolver<OrganizationFormValues>,
    defaultValues,
  });

  const { fields: branchFields, append: appendBranch, remove: removeBranch } = useFieldArray({
    control,
    name: "branches",
  });
  const postalAddressMatchesRegistration = useWatch({
    control,
    name: "postalAddressMatchesRegistration",
  });
  const terminationType = useWatch({
    control,
    name: "personalDataProcessingTerminationType",
  });
  const operatorType = useWatch({
    control,
    name: "operatorType",
  });
  const identityDocumentType = useWatch({
    control,
    name: "identityDocumentType",
  });
  const isIndividualEntrepreneur = operatorType === "individual_entrepreneur";

  const { data: employeeOptions = [] } = useQuery({
    queryKey: ["employees", "options"],
    queryFn: getEmployeeOptions,
  });

  const employeeHelperText =
    employeeOptions.length === 0 ? "Сначала добавьте сотрудника в реестр сотрудников." : undefined;

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  return (
    <Stack component="form" spacing={3} onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormSection title="Основные сведения об операторе">
        <Controller
          control={control}
          name="operatorType"
          render={({ field }) => (
            <TextField select label="Тип оператора" fullWidth {...field} error={Boolean(errors.operatorType)}>
              {operatorTypeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        {!isIndividualEntrepreneur && (
          <TextField
            label="Сокращённое название организации"
            fullWidth
            required
            {...register("shortLegalName")}
            error={Boolean(errors.shortLegalName)}
            helperText={errors.shortLegalName?.message ?? "Например: ООО «Ромашка»."}
          />
        )}
        <TextField
          label="Полное название организации"
          fullWidth
          required
          multiline
          minRows={2}
          {...register("fullLegalName")}
          error={Boolean(errors.fullLegalName)}
          helperText={errors.fullLegalName?.message ?? "Полное наименование организации по учредительным документам."}
        />
        <Controller
          control={control}
          name="headEmployeeId"
          render={({ field }) => (
            <EmployeeSelect
              value={field.value}
              onChange={field.onChange}
              label="Руководитель организации"
              required
              allowQuickCreate
              quickCreateButtonPlacement="inline"
              disabled={isSubmitting}
              error={Boolean(errors.headEmployeeId)}
              helperText={errors.headEmployeeId?.message ?? employeeHelperText}
            />
          )}
        />
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            label="ИНН"
            fullWidth
            required
            slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 10 } }}
            {...register("inn")}
            error={Boolean(errors.inn)}
            helperText={errors.inn?.message ?? "10 цифр для юридического лица."}
          />
          <TextField
            label="ОГРН"
            fullWidth
            required
            slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 13 } }}
            {...register("ogrn")}
            error={Boolean(errors.ogrn)}
            helperText={errors.ogrn?.message ?? "13 цифр основного государственного регистрационного номера."}
          />
          <TextField
            label="КПП"
            fullWidth
            required
            slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 9 } }}
            {...register("kpp")}
            error={Boolean(errors.kpp)}
            helperText={errors.kpp?.message ?? "9 цифр кода причины постановки на учёт."}
          />
        </Stack>
      </FormSection>

      {isIndividualEntrepreneur && (
        <FormSection title="Документ, удостоверяющий личность">
          <Controller
            control={control}
            name="identityDocumentType"
            render={({ field }) => (
              <TextField
                select
                label="Документ, удостоверяющий личность"
                fullWidth
                required
                {...field}
                error={Boolean(errors.identityDocumentType)}
                helperText={errors.identityDocumentType?.message}
              >
                <MenuItem value="">Не выбран</MenuItem>
                {identityDocumentTypeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          {identityDocumentType === "other_rf_document" && (
            <TextField
              label="Документ"
              fullWidth
              required
              {...register("identityDocumentName")}
              error={Boolean(errors.identityDocumentName)}
              helperText={errors.identityDocumentName?.message}
            />
          )}
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Серия"
              fullWidth
              required
              slotProps={{ htmlInput: { inputMode: "numeric" } }}
              {...register("identityDocumentSeries")}
              error={Boolean(errors.identityDocumentSeries)}
              helperText={errors.identityDocumentSeries?.message}
            />
            <TextField
              label="Номер"
              fullWidth
              required
              slotProps={{ htmlInput: { inputMode: "numeric" } }}
              {...register("identityDocumentNumber")}
              error={Boolean(errors.identityDocumentNumber)}
              helperText={errors.identityDocumentNumber?.message}
            />
            <TextField
              label="Дата выдачи"
              type="date"
              fullWidth
              required
              slotProps={{ inputLabel: { shrink: true } }}
              {...register("identityDocumentIssuedDate")}
              error={Boolean(errors.identityDocumentIssuedDate)}
              helperText={errors.identityDocumentIssuedDate?.message}
            />
          </Stack>
          <TextField
            label="Кем выдан"
            fullWidth
            required
            multiline
            minRows={2}
            {...register("identityDocumentIssuedBy")}
            error={Boolean(errors.identityDocumentIssuedBy)}
            helperText={errors.identityDocumentIssuedBy?.message}
          />
        </FormSection>
      )}

      <FormSection title="Контактные данные">
        <TextField
          label="Адрес регистрации"
          fullWidth
          required
          multiline
          minRows={2}
          {...register("registrationAddress")}
          error={Boolean(errors.registrationAddress)}
          helperText={errors.registrationAddress?.message ?? "Юридический адрес регистрации организации."}
        />
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            label="Город регистрации"
            fullWidth
            required
            {...register("registrationCity")}
            error={Boolean(errors.registrationCity)}
            helperText={errors.registrationCity?.message ?? "Город будет использоваться в документах организации."}
          />
          <TextField
            label="Регион головного офиса"
            fullWidth
            {...register("headOfficeRegion")}
            error={Boolean(errors.headOfficeRegion)}
            helperText={errors.headOfficeRegion?.message}
          />
        </Stack>
        <FormControlLabel
          control={
            <Controller
              control={control}
              name="postalAddressMatchesRegistration"
              render={({ field }) => (
                <Checkbox checked={field.value} onChange={(event) => field.onChange(event.target.checked)} />
              )}
            />
          }
          label="Почтовый адрес совпадает с адресом местонахождения"
        />
        {!postalAddressMatchesRegistration && (
          <TextField
            label="Почтовый адрес"
            fullWidth
            required
            multiline
            minRows={2}
            {...register("postalAddress")}
            error={Boolean(errors.postalAddress)}
            helperText={errors.postalAddress?.message}
          />
        )}
        <TextField
          label="Регионы деятельности компании"
          fullWidth
          multiline
          minRows={2}
          {...register("activityRegions")}
          error={Boolean(errors.activityRegions)}
          helperText={errors.activityRegions?.message}
        />
        <TextField
          label="Адрес офиса Роскомнадзора"
          fullWidth
          required
          multiline
          minRows={2}
          {...register("rknOfficeAddress")}
          error={Boolean(errors.rknOfficeAddress)}
          helperText={errors.rknOfficeAddress?.message}
        />
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Controller
            control={control}
            name="phone"
            render={({ field }) => (
              <TextField
                label="Телефон"
                fullWidth
                value={field.value}
                onChange={(event) => field.onChange(formatPhoneInput(event.target.value))}
                error={Boolean(errors.phone)}
                helperText={errors.phone?.message ?? "Формат: +7(999)999-99-99."}
              />
            )}
          />
          <Controller
            control={control}
            name="fax"
            render={({ field }) => (
              <TextField
                label="Факс"
                fullWidth
                value={field.value}
                onChange={(event) => field.onChange(formatPhoneInput(event.target.value))}
                error={Boolean(errors.fax)}
                helperText={errors.fax?.message ?? "Формат: +7(999)999-99-99."}
              />
            )}
          />
          <TextField
            label="Email"
            fullWidth
            {...register("email")}
            error={Boolean(errors.email)}
            helperText={errors.email?.message}
          />
        </Stack>
      </FormSection>

      <FormSection title="Прекращение обработки ПДн">
        <Controller
          control={control}
          name="personalDataProcessingTerminationType"
          render={({ field }) => (
            <TextField
              select
              label="Срок или условие прекращения обработки ПДн"
              fullWidth
              required
              value={field.value}
              onChange={(event) => field.onChange(event.target.value)}
              error={Boolean(errors.personalDataProcessingTerminationType)}
              helperText={errors.personalDataProcessingTerminationType?.message}
            >
              <MenuItem value="">Не выбрано</MenuItem>
              {terminationTypeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        {terminationType === "end_date" && (
          <TextField
            label="Дата прекращения обработки ПДн"
            type="date"
            fullWidth
            required
            slotProps={{ inputLabel: { shrink: true } }}
            {...register("personalDataProcessingTerminationDate")}
            error={Boolean(errors.personalDataProcessingTerminationDate)}
            helperText={errors.personalDataProcessingTerminationDate?.message}
          />
        )}
        {terminationType === "end_condition" && (
          <TextField
            label="Условие окончания прекращения обработки ПДн"
            fullWidth
            required
            multiline
            minRows={3}
            {...register("personalDataProcessingTerminationCondition")}
            error={Boolean(errors.personalDataProcessingTerminationCondition)}
            helperText={errors.personalDataProcessingTerminationCondition?.message}
          />
        )}
      </FormSection>

      <FormSection title="Статистические данные для РКН">
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            label="ОКПО"
            fullWidth
            slotProps={{ htmlInput: { maxLength: 32 } }}
            {...register("okpo")}
            error={Boolean(errors.okpo)}
            helperText={errors.okpo?.message ?? "ОКПО — код организации в статистическом регистре."}
          />
          <TextField
            label="ОКФС"
            fullWidth
            slotProps={{ htmlInput: { maxLength: 32 } }}
            {...register("okfs")}
            error={Boolean(errors.okfs)}
            helperText={errors.okfs?.message ?? "ОКФС — код формы собственности."}
          />
          <TextField
            label="ОКОГУ"
            fullWidth
            slotProps={{ htmlInput: { maxLength: 32 } }}
            {...register("okogu")}
            error={Boolean(errors.okogu)}
            helperText={errors.okogu?.message ?? "ОКОГУ — код органа государственной власти и управления."}
          />
          <TextField
            label="ОКОПФ"
            fullWidth
            slotProps={{ htmlInput: { maxLength: 32 } }}
            {...register("okopf")}
            error={Boolean(errors.okopf)}
            helperText={errors.okopf?.message ?? "ОКОПФ — код организационно-правовой формы."}
          />
        </Stack>
        <Controller
          control={control}
          name="okveds"
          render={({ field }) => {
            const value = field.value ?? [];
            const unknownCount = value.filter((item) => !okvedOptionCodes.has(item.code)).length;
            const errorMessage = getOkvedErrorMessage(errors.okveds);
            const helperText =
              errorMessage ??
              (unknownCount > 0
                ? `Есть ОКВЭД вне текущего справочника: ${unknownCount}. Его можно удалить.`
                : undefined);

            return (
              <Stack spacing={1.5}>
                <Autocomplete
                  multiple
                  options={okvedOptions}
                  value={value}
                  filterSelectedOptions
                  disableCloseOnSelect
                  noOptionsText="ОКВЭД не найден"
                  filterOptions={(options, state) => filterOkvedOptions(options, state.inputValue)}
                  getOptionLabel={getOkvedLabel}
                  isOptionEqualToValue={(option, selected) => option.code === selected.code}
                  onChange={(_, selectedOptions) =>
                    field.onChange(selectedOptions.map((option) => ({ code: option.code, name: option.name })))
                  }
                  renderValue={() => null}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="ОКВЭД"
                      placeholder="Введите код или название ОКВЭД"
                      error={Boolean(errorMessage)}
                      helperText={helperText}
                    />
                  )}
                />
                {value.length > 0 && (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: 180 }}>Код</TableCell>
                        <TableCell>Наименование</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {value.map((okved) => (
                        <TableRow key={okved.code}>
                          <TableCell>{okved.code}</TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                              <Typography variant="body2">{okved.name}</Typography>
                              <IconButton
                                type="button"
                                aria-label="Удалить ОКВЭД"
                                size="small"
                                onClick={() => field.onChange(value.filter((item) => item.code !== okved.code))}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Stack>
            );
          }}
        />
      </FormSection>

      <FormSection title="Ответственные лица">
        <Stack spacing={2}>
          {[
            ["documentApproverEmployeeId", "Уполномоченный утверждать документы"],
            ["personalDataProcessingResponsibleEmployeeId", "Ответственный за обработку персональных данных"],
          ].map(([name, label]) => (
            <Controller
              key={name}
              control={control}
              name={name as keyof Pick<
                OrganizationFormValues,
                | "documentApproverEmployeeId"
                | "personalDataProcessingResponsibleEmployeeId"
              >}
              render={({ field }) => (
                <TextField
                  select
                  label={label}
                  fullWidth
                  value={field.value ?? ""}
                  onChange={(event) => field.onChange(event.target.value === "" ? null : Number(event.target.value))}
                  helperText={employeeHelperText}
                >
                  <MenuItem value="">Не выбран</MenuItem>
                  {employeeOptions.map((employee) => (
                    <MenuItem key={employee.id} value={employee.id}>
                      {employee.fullName} — {employee.position}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          ))}
        </Stack>
      </FormSection>

      <FormSection title="Филиалы">
        <Stack spacing={1.5}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Список филиалов
            </Typography>
            <Button
              type="button"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => appendBranch({ name: "", postalAddress: "" })}
            >
              Добавить строку
            </Button>
          </Stack>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: "35%" }}>Наименование</TableCell>
                <TableCell>Почтовый адрес</TableCell>
                <TableCell align="right" sx={{ width: 96 }}>
                  Действия
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {branchFields.map((field, index) => (
                <TableRow key={field.id}>
                  <TableCell>
                    <TextField
                      fullWidth
                      slotProps={{ htmlInput: { maxLength: 255 } }}
                      {...register(`branches.${index}.name`)}
                      error={Boolean(errors.branches?.[index]?.name)}
                      helperText={errors.branches?.[index]?.name?.message}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      {...register(`branches.${index}.postalAddress`)}
                      error={Boolean(errors.branches?.[index]?.postalAddress)}
                      helperText={errors.branches?.[index]?.postalAddress?.message}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton type="button" aria-label="Удалить филиал" onClick={() => removeBranch(index)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Stack>
      </FormSection>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "flex-end" }}>
        <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={isSubmitting}>
          {isSubmitting ? "Сохранение..." : submitLabel}
        </Button>
      </Stack>
    </Stack>
  );
}
