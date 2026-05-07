import SaveIcon from "@mui/icons-material/Save";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Stack, TextField } from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import type { OrganizationFormValues } from "../../../entities/organization/model/types";
import { FormSection } from "../../../shared/ui/FormSection";
import { organizationCardFormSchema } from "../model/schema";

type OrganizationCardFormProps = {
  defaultValues: OrganizationFormValues;
  isSubmitting?: boolean;
  submitLabel?: string;
  onSubmit: (values: OrganizationFormValues) => void;
};

export function OrganizationCardForm({
  defaultValues,
  isSubmitting,
  submitLabel = "Сохранить",
  onSubmit,
}: OrganizationCardFormProps) {
  const {
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationCardFormSchema),
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  return (
    <Stack component="form" spacing={3} onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormSection title="Сведения о юридическом лице">
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
      </FormSection>

      <FormSection title="Регистрационные данные">
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

      <FormSection title="Руководитель">
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            label="ФИО руководителя"
            fullWidth
            required
            {...register("headFullName")}
            error={Boolean(errors.headFullName)}
            helperText={errors.headFullName?.message ?? "Фамилия, имя и отчество руководителя организации."}
          />
          <TextField
            label="Должность руководителя"
            fullWidth
            required
            {...register("headPosition")}
            error={Boolean(errors.headPosition)}
            helperText={errors.headPosition?.message ?? "Например: Генеральный директор."}
          />
        </Stack>
      </FormSection>

      <FormSection title="Адрес">
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
        <TextField
          label="Город регистрации"
          fullWidth
          required
          {...register("registrationCity")}
          error={Boolean(errors.registrationCity)}
          helperText={errors.registrationCity?.message ?? "Город будет использоваться в документах организации."}
        />
      </FormSection>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "flex-end" }}>
        <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={isSubmitting}>
          {isSubmitting ? "Сохранение..." : submitLabel}
        </Button>
      </Stack>
    </Stack>
  );
}
