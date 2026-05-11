import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { generateGlobalDocument } from "../../../entities/document/api/documentApi";
import type {
  GenerateGlobalDocumentPayload,
  RknAccessPersonType,
  RknNotificationFormValues,
} from "../../../entities/document/model/types";
import { HttpError } from "../../../shared/api/httpClient";
import { requiredText } from "../../../shared/lib/validation";

const accessPersonTypeLabels: Record<RknAccessPersonType, string> = {
  individual: "Физическое лицо",
  individual_entrepreneur: "Индивидуальный предприниматель",
  legal_entity: "Юридическое лицо",
  foreign_organization: "Иностранная организация",
};

const rknNotificationSchema = z.object({
  rknAccessPersons: z.array(
    z.object({
      personType: z.enum(["individual", "individual_entrepreneur", "legal_entity", "foreign_organization"]),
      name: requiredText("Укажите ФИО или наименование"),
      address: requiredText("Укажите адрес"),
      email: z.string(),
      phone: z.string(),
    }),
  ),
});

function nullableTrimmedText(value: string) {
  const trimmed = value.trim();
  return trimmed || null;
}

function mapToPayload(values: RknNotificationFormValues): GenerateGlobalDocumentPayload {
  return {
    documentType: "RKN_notification",
    manualData: {
      rkn_access_persons: values.rknAccessPersons.map((person) => ({
        person_type: person.personType,
        name: person.name.trim(),
        address: person.address.trim(),
        email: nullableTrimmedText(person.email),
        phone: nullableTrimmedText(person.phone),
      })),
    },
  };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function getGenerationErrorMessage(error: unknown) {
  if (error instanceof HttpError) {
    return error.message.replace(/^HTTP \d+:\s*/, "");
  }
  return "Не удалось сформировать документ. Проверьте данные формы, доступность backend API и наличие системного шаблона.";
}

type AccessPersonNameFieldProps = {
  control: ReturnType<typeof useForm<RknNotificationFormValues>>["control"];
  index: number;
  disabled: boolean;
  error?: string;
};

function AccessPersonNameField({ control, index, disabled, error }: AccessPersonNameFieldProps) {
  const personType = useWatch({
    control,
    name: `rknAccessPersons.${index}.personType`,
  });
  const label =
    personType === "legal_entity" || personType === "foreign_organization"
      ? "Наименование организации"
      : "ФИО";

  return (
    <Controller
      name={`rknAccessPersons.${index}.name`}
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          label={label}
          disabled={disabled}
          error={Boolean(error)}
          helperText={error}
          fullWidth
        />
      )}
    />
  );
}

export function GenerateRknNotificationForm() {
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RknNotificationFormValues>({
    resolver: zodResolver(rknNotificationSchema),
    defaultValues: {
      rknAccessPersons: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "rknAccessPersons",
  });

  const mutation = useMutation({
    mutationFn: (values: RknNotificationFormValues) => generateGlobalDocument(mapToPayload(values)),
    onSuccess: ({ blob, filename }) => {
      setDownloadError(null);
      try {
        downloadBlob(blob, filename);
      } catch {
        setDownloadError("Файл сформирован, но браузер не смог начать скачивание.");
      }
    },
  });

  const disabled = mutation.isPending;

  return (
    <Box component="form" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
      <Stack spacing={3}>
        {mutation.isError && <Alert severity="error">{getGenerationErrorMessage(mutation.error)}</Alert>}
        {downloadError && <Alert severity="error">{downloadError}</Alert>}
        {mutation.isSuccess && !downloadError && (
          <Alert severity="success">Документ сформирован и передан на скачивание.</Alert>
        )}

        <Stack spacing={2}>
          <Box>
            <Typography component="h3" variant="h6" sx={{ fontWeight: 600 }}>
              Лица и организации с доступом к ПДн в ГИС/МИС
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Раздел можно оставить пустым, если такие лица или организации отсутствуют.
            </Typography>
          </Box>

          <Stack spacing={2}>
            {fields.map((field, index) => (
              <Box
                key={field.id}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  p: 2,
                  bgcolor: "background.paper",
                }}
              >
                <Stack spacing={2}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
                  >
                    <Typography sx={{ fontWeight: 600 }}>Запись {index + 1}</Typography>
                    <Button
                      type="button"
                      variant="outlined"
                      color="inherit"
                      startIcon={<DeleteIcon />}
                      disabled={disabled}
                      onClick={() => remove(index)}
                    >
                      Удалить
                    </Button>
                  </Stack>

                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <Controller
                      name={`rknAccessPersons.${index}.personType`}
                      control={control}
                      render={({ field: personTypeField }) => (
                        <TextField
                          {...personTypeField}
                          select
                          label="Тип"
                          disabled={disabled}
                          error={Boolean(errors.rknAccessPersons?.[index]?.personType)}
                          helperText={errors.rknAccessPersons?.[index]?.personType?.message}
                          fullWidth
                        >
                          {Object.entries(accessPersonTypeLabels).map(([value, label]) => (
                            <MenuItem key={value} value={value}>
                              {label}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                    <AccessPersonNameField
                      control={control}
                      index={index}
                      disabled={disabled}
                      error={errors.rknAccessPersons?.[index]?.name?.message}
                    />
                  </Stack>

                  <TextField
                    label="Адрес"
                    disabled={disabled}
                    error={Boolean(errors.rknAccessPersons?.[index]?.address)}
                    helperText={errors.rknAccessPersons?.[index]?.address?.message}
                    {...register(`rknAccessPersons.${index}.address`)}
                  />
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                      label="Электронная почта"
                      disabled={disabled}
                      fullWidth
                      {...register(`rknAccessPersons.${index}.email`)}
                    />
                    <TextField
                      label="Телефон"
                      disabled={disabled}
                      fullWidth
                      {...register(`rknAccessPersons.${index}.phone`)}
                    />
                  </Stack>
                </Stack>
              </Box>
            ))}
          </Stack>

          <Button
            type="button"
            variant="outlined"
            startIcon={<AddIcon />}
            disabled={disabled}
            onClick={() =>
              append({
                personType: "legal_entity",
                name: "",
                address: "",
                email: "",
                phone: "",
              })
            }
            sx={{ alignSelf: "flex-start" }}
          >
            Добавить лицо / организацию
          </Button>
        </Stack>

        <Button
          type="submit"
          variant="contained"
          color="secondary"
          startIcon={<DownloadIcon />}
          disabled={disabled}
          sx={{ alignSelf: "flex-start" }}
        >
          {mutation.isPending ? "Формирование..." : "Сформировать .docx"}
        </Button>
      </Stack>
    </Box>
  );
}
