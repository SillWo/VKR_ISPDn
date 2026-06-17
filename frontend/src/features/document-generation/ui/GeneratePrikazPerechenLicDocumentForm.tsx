import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { forwardRef, useImperativeHandle, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { generateIspdnDocument } from "../../../entities/document/api/documentApi";
import type {
  GeneratedDocumentFile,
  GenerateIspdnDocumentPayload,
  PrikazPerechenLicDocumentFormValues,
} from "../../../entities/document/model/types";
import { requiredText } from "../../../shared/lib/validation";
import { EmployeeSelect } from "../../../shared/ui/employee-select/EmployeeSelect";

const prikazPerechenLicDocumentSchema = z
  .object({
    orderNumber: requiredText("Укажите номер приказа"),
    accessPersons: z
      .array(
        z
          .object({
            employeeId: z.number().nullable(),
          })
          .refine((person) => person.employeeId !== null, {
            message: "Выберите сотрудника из реестра",
            path: ["employeeId"],
          }),
      )
      .min(1, "Добавьте минимум одного сотрудника с доступом к ПДн"),
  })
  .refine(
    (values) => {
      const employeeIds = values.accessPersons
        .map((person) => person.employeeId)
        .filter((employeeId): employeeId is number => employeeId !== null);
      return employeeIds.length === new Set(employeeIds).size;
    },
    {
      message: "Один сотрудник не может быть выбран дважды",
      path: ["accessPersons"],
    },
  );

function mapToPayload(values: PrikazPerechenLicDocumentFormValues): GenerateIspdnDocumentPayload {
  return {
    documentType: "prikaz_perechen_lic",
    manualData: {
      order_number: values.orderNumber.trim(),
      access_persons: values.accessPersons.map((person) => ({
        employee_id: person.employeeId ?? 0,
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

type GeneratePrikazPerechenLicDocumentFormProps = {
  ispdnId: number;
  disabled?: boolean;
  showSubmitButton?: boolean;
  onGenerated?: () => void;
};

export type GeneratePrikazPerechenLicDocumentFormHandle = {
  generate: () => Promise<void>;
  prepare: () => Promise<GeneratedDocumentFile>;
  getPayload: () => Promise<GenerateIspdnDocumentPayload>;
};

export const GeneratePrikazPerechenLicDocumentForm = forwardRef<
  GeneratePrikazPerechenLicDocumentFormHandle,
  GeneratePrikazPerechenLicDocumentFormProps
>(function GeneratePrikazPerechenLicDocumentForm({
  ispdnId,
  disabled = false,
  showSubmitButton = true,
  onGenerated,
}: GeneratePrikazPerechenLicDocumentFormProps, ref) {
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PrikazPerechenLicDocumentFormValues>({
    resolver: zodResolver(prikazPerechenLicDocumentSchema),
    defaultValues: {
      orderNumber: "",
      accessPersons: [{ employeeId: null }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "accessPersons",
  });

  const generateFile = async (values: PrikazPerechenLicDocumentFormValues) => {
    setDownloadError(null);
    return generateIspdnDocument(ispdnId, mapToPayload(values));
  };

  const mutation = useMutation({
    mutationFn: async (values: PrikazPerechenLicDocumentFormValues) => {
      const file = await generateFile(values);
      try {
        downloadBlob(file.blob, file.filename);
        onGenerated?.();
      } catch {
        setDownloadError("Файл сформирован, но браузер не смог начать скачивание.");
        throw new Error("Файл сформирован, но браузер не смог начать скачивание.");
      }
    },
  });

  useImperativeHandle(ref, () => ({
    generate: () =>
      new Promise<void>((resolve, reject) => {
        void handleSubmit(
          async (values) => {
            try {
              await mutation.mutateAsync(values);
              resolve();
            } catch (error) {
              reject(error);
            }
          },
          () => reject(new Error("Проверьте номер приказа и перечень сотрудников с доступом к ПДн.")),
        )();
      }),
    prepare: () =>
      new Promise<GeneratedDocumentFile>((resolve, reject) => {
        void handleSubmit(
          async (values) => {
            try {
              resolve(await generateFile(values));
            } catch (error) {
              reject(error);
            }
          },
          () => reject(new Error("Проверьте номер приказа и перечень сотрудников с доступом к ПДн.")),
        )();
      }),
    getPayload: () =>
      new Promise<GenerateIspdnDocumentPayload>((resolve, reject) => {
        void handleSubmit(
          (values) => resolve(mapToPayload(values)),
          () => reject(new Error("Проверьте номер приказа и перечень сотрудников с доступом к ПДн.")),
        )();
      }),
  }));

  const submitForm = handleSubmit((values) => {
    mutation.mutate(values);
  });

  return (
    <Box component="form" onSubmit={submitForm}>
      <Stack spacing={3}>
        {mutation.isError && (
          <Alert severity="error">
            Не удалось сформировать документ. Проверьте номер приказа, выбранных сотрудников, доступность backend API и
            наличие системного шаблона.
          </Alert>
        )}
        {downloadError && <Alert severity="error">{downloadError}</Alert>}
        {mutation.isSuccess && !downloadError && (
          <Alert severity="success">Документ сформирован и передан на скачивание.</Alert>
        )}

        <TextField
          label="Номер приказа"
          disabled={disabled || mutation.isPending}
          error={Boolean(errors.orderNumber)}
          helperText={errors.orderNumber?.message}
          {...register("orderNumber")}
        />

        <Stack spacing={2}>
          <Box>
            <Typography component="h3" variant="h6" sx={{ fontWeight: 600 }}>
              Сотрудники с доступом к ПДн
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Выберите сотрудников из реестра. ФИО и должность будут подставлены в приложение к приказу автоматически.
            </Typography>
          </Box>

          {typeof errors.accessPersons?.message === "string" && (
            <Alert severity="error">{errors.accessPersons.message}</Alert>
          )}
          {errors.accessPersons?.root?.message && <Alert severity="error">{errors.accessPersons.root.message}</Alert>}

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
                      disabled={disabled || mutation.isPending || fields.length === 1}
                      onClick={() => remove(index)}
                    >
                      Удалить
                    </Button>
                  </Stack>
                  <Controller
                    name={`accessPersons.${index}.employeeId`}
                    control={control}
                    render={({ field: employeeField }) => (
                      <EmployeeSelect
                        value={employeeField.value}
                        onChange={employeeField.onChange}
                        label="Сотрудник с доступом к ПДн"
                        required
                        allowQuickCreate
                        disabled={disabled || mutation.isPending}
                        error={Boolean(errors.accessPersons?.[index]?.employeeId)}
                        helperText={errors.accessPersons?.[index]?.employeeId?.message}
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
            Добавить сотрудника
          </Button>
        </Stack>

        {showSubmitButton && (
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
        )}
      </Stack>
    </Box>
  );
});
