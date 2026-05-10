import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { generateIspdnDocument } from "../../../entities/document/api/documentApi";
import type {
  ActSafetyLevelDocumentFormValues,
  GenerateIspdnDocumentPayload,
} from "../../../entities/document/model/types";
import { HttpError } from "../../../shared/api/httpClient";
import { EmployeeSelect } from "../../../shared/ui/employee-select/EmployeeSelect";

const actSafetyLevelDocumentSchema = z
  .object({
    commissionMembers: z
      .array(
        z
          .object({
            employeeId: z.number().nullable(),
          })
          .refine((member) => member.employeeId !== null, {
            message: "Выберите сотрудника комиссии из реестра",
            path: ["employeeId"],
          }),
      )
      .min(1, "Добавьте минимум одного члена комиссии"),
  })
  .refine(
    (values) => {
      const employeeIds = values.commissionMembers
        .map((member) => member.employeeId)
        .filter((employeeId): employeeId is number => employeeId !== null);
      return employeeIds.length === new Set(employeeIds).size;
    },
    {
      message: "Один сотрудник не может быть выбран дважды",
      path: ["commissionMembers"],
    },
  );

function mapToPayload(values: ActSafetyLevelDocumentFormValues): GenerateIspdnDocumentPayload {
  return {
    documentType: "act_safety_level_of_ISPDn",
    manualData: {
      commission_members: values.commissionMembers.map((member) => ({
        employee_id: member.employeeId ?? 0,
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
  if (
    error instanceof HttpError
    && error.status === 422
    && error.message.includes("Уровень защищённости")
  ) {
    return 'Для формирования акта сначала заполните модуль "Уровень защищённости" для выбранной ИСПДн.';
  }
  return "Не удалось сформировать документ. Проверьте состав комиссии, доступность backend API и наличие системного шаблона.";
}

type GenerateActSafetyLevelDocumentFormProps = {
  ispdnId: number;
  disabled?: boolean;
};

export function GenerateActSafetyLevelDocumentForm({
  ispdnId,
  disabled = false,
}: GenerateActSafetyLevelDocumentFormProps) {
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ActSafetyLevelDocumentFormValues>({
    resolver: zodResolver(actSafetyLevelDocumentSchema),
    defaultValues: {
      commissionMembers: [{ employeeId: null }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "commissionMembers",
  });

  const mutation = useMutation({
    mutationFn: (values: ActSafetyLevelDocumentFormValues) => generateIspdnDocument(ispdnId, mapToPayload(values)),
    onSuccess: ({ blob, filename }) => {
      setDownloadError(null);
      try {
        downloadBlob(blob, filename);
      } catch {
        setDownloadError("Файл сформирован, но браузер не смог начать скачивание.");
      }
    },
  });

  return (
    <Box component="form" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
      <Stack spacing={3}>
        {mutation.isError && <Alert severity="error">{getGenerationErrorMessage(mutation.error)}</Alert>}
        {downloadError && <Alert severity="error">{downloadError}</Alert>}
        {mutation.isSuccess && !downloadError && <Alert severity="success">Документ сформирован и передан на скачивание.</Alert>}

        <Stack spacing={2}>
          <Box>
            <Typography component="h3" variant="h6" sx={{ fontWeight: 600 }}>
              Состав комиссии
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Выберите сотрудников из реестра. ФИО и должности будут подставлены backend при формировании документа.
            </Typography>
          </Box>

          {typeof errors.commissionMembers?.message === "string" && (
            <Alert severity="error">{errors.commissionMembers.message}</Alert>
          )}
          {errors.commissionMembers?.root?.message && (
            <Alert severity="error">{errors.commissionMembers.root.message}</Alert>
          )}

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
                    <Typography sx={{ fontWeight: 600 }}>Член комиссии {index + 1}</Typography>
                    <Button
                      type="button"
                      variant="outlined"
                      color="inherit"
                      startIcon={<DeleteIcon />}
                      disabled={disabled || mutation.isPending || fields.length === 1}
                      onClick={() => remove(index)}
                    >
                      Удалить
                    </Button>
                  </Stack>
                  <Controller
                    name={`commissionMembers.${index}.employeeId`}
                    control={control}
                    render={({ field: employeeField }) => (
                      <EmployeeSelect
                        value={employeeField.value}
                        onChange={employeeField.onChange}
                        label="Сотрудник комиссии"
                        required
                        allowQuickCreate
                        disabled={disabled || mutation.isPending}
                        error={Boolean(errors.commissionMembers?.[index]?.employeeId)}
                        helperText={errors.commissionMembers?.[index]?.employeeId?.message}
                      />
                    )}
                  />
                </Stack>
              </Box>
            ))}
          </Stack>

          <Button
            type="button"
            variant="outlined"
            startIcon={<AddIcon />}
            disabled={disabled || mutation.isPending}
            onClick={() => append({ employeeId: null })}
            sx={{ alignSelf: "flex-start" }}
          >
            Добавить члена комиссии
          </Button>
        </Stack>

        <Button
          type="submit"
          variant="contained"
          color="secondary"
          startIcon={<DownloadIcon />}
          disabled={disabled || mutation.isPending}
          sx={{ alignSelf: "flex-start" }}
        >
          {mutation.isPending ? "Формирование..." : "Сформировать .docx"}
        </Button>
      </Stack>
    </Box>
  );
}
