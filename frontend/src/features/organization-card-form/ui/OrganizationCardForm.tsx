import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  Switch,
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
import type { OrganizationFormValues } from "../../../entities/organization/model/types";
import { FormSection } from "../../../shared/ui/FormSection";
import { organizationCardFormSchema } from "../model/schema";

const operatorTypeOptions = [
  { value: "", label: "Не выбран" },
  { value: "legal_entity", label: "Юридическое лицо" },
  { value: "individual_entrepreneur", label: "Индивидуальный предприниматель" },
  { value: "state_body", label: "Государственный орган" },
  { value: "municipal_body", label: "Муниципальный орган" },
  { value: "branch", label: "Филиал" },
  { value: "foreign_citizen", label: "Иностранный гражданин" },
] as const;

const terminationTypeOptions = [
  { value: "end_date", label: "Дата окончания" },
  { value: "end_condition", label: "Условие окончания" },
] as const;

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

  const { fields: okvedFields, append: appendOkved, remove: removeOkved } = useFieldArray({
    control,
    name: "okveds",
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
        <TextField
          label="Сокращённое название юр.лица"
          fullWidth
          required
          {...register("shortLegalName")}
          error={Boolean(errors.shortLegalName)}
          helperText={errors.shortLegalName?.message ?? "Например: ООО «Ромашка»."}
        />
        <TextField
          label="Полное название юр.лица"
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
            <TextField
              select
              label="Руководитель организации"
              fullWidth
              required
              value={field.value ?? ""}
              onChange={(event) => field.onChange(event.target.value === "" ? null : Number(event.target.value))}
              error={Boolean(errors.headEmployeeId)}
              helperText={errors.headEmployeeId?.message ?? employeeHelperText}
            >
              <MenuItem value="">Не выбран</MenuItem>
              {employeeOptions.map((employee) => (
                <MenuItem key={employee.id} value={employee.id}>
                  {employee.fullName} - {employee.position}
                </MenuItem>
              ))}
            </TextField>
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
              render={({ field }) => <Switch checked={field.value} onChange={(_, checked) => field.onChange(checked)} />}
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
        <Stack spacing={1.5}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              ОКВЭД
            </Typography>
            <Button type="button" variant="outlined" startIcon={<AddIcon />} onClick={() => appendOkved({ code: "", name: "" })}>
              Добавить строку
            </Button>
          </Stack>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 180 }}>Код</TableCell>
                <TableCell>Наименование</TableCell>
                <TableCell align="right" sx={{ width: 96 }}>
                  Действия
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {okvedFields.map((field, index) => (
                <TableRow key={field.id}>
                  <TableCell>
                    <TextField
                      fullWidth
                      slotProps={{ htmlInput: { maxLength: 32 } }}
                      {...register(`okveds.${index}.code`)}
                      error={Boolean(errors.okveds?.[index]?.code)}
                      helperText={errors.okveds?.[index]?.code?.message}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      {...register(`okveds.${index}.name`)}
                      error={Boolean(errors.okveds?.[index]?.name)}
                      helperText={errors.okveds?.[index]?.name?.message}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton type="button" aria-label="Удалить ОКВЭД" onClick={() => removeOkved(index)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Stack>
      </FormSection>

      <FormSection title="Ответственные лица">
        <Stack spacing={2}>
          {[
            ["documentApproverEmployeeId", "Уполномоченный утверждать документы"],
            ["informationSecurityResponsibleEmployeeId", "Ответственный за обеспечение защиты информации"],
            ["personalDataProcessingResponsibleEmployeeId", "Ответственный за организацию работы по персональным данным"],
          ].map(([name, label]) => (
            <Controller
              key={name}
              control={control}
              name={name as keyof Pick<
                OrganizationFormValues,
                | "documentApproverEmployeeId"
                | "informationSecurityResponsibleEmployeeId"
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
