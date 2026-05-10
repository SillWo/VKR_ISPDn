import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Box, Button, Divider, Stack, TextField, Typography } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { generateIspdnDocument } from "../../../entities/document/api/documentApi";
import type {
  ActIspdnCommissioningFormValues,
  GenerateIspdnDocumentPayload,
} from "../../../entities/document/model/types";
import { requiredText } from "../../../shared/lib/validation";
import { ControlEventSelect } from "../../../shared/ui/control-event-select/ControlEventSelect";
import { EmployeeSelect } from "../../../shared/ui/employee-select/EmployeeSelect";

const actIspdnCommissioningSchema = z.object({
  descriptionOfViolationsAndDisadvantages: requiredText("Укажите обнаруженные нарушения и недостатки"),
  recommendation: requiredText("Укажите рекомендации"),
  events: z
    .array(
      z
        .object({
          controlEventId: z.number().nullable(),
          responsibleEmployeeId: z.number().nullable(),
        })
        .refine((event) => event.controlEventId !== null, {
          message: "Выберите контрольное мероприятие из реестра",
          path: ["controlEventId"],
        })
        .refine((event) => event.responsibleEmployeeId !== null, {
          message: "Выберите ответственного сотрудника из реестра",
          path: ["responsibleEmployeeId"],
        }),
    )
    .min(1, "Добавьте минимум одно мероприятие"),
});

function mapToPayload(values: ActIspdnCommissioningFormValues): GenerateIspdnDocumentPayload {
  return {
    documentType: "act_ispdn_commissioning",
    manualData: {
      description_of_violations_and_disadvantages: values.descriptionOfViolationsAndDisadvantages.trim(),
      recommendation: values.recommendation.trim(),
      events: values.events.map((event) => ({
        control_event_id: event.controlEventId ?? 0,
        responsible_employee_id: event.responsibleEmployeeId ?? 0,
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

type GenerateActIspdnDocumentFormProps = {
  ispdnId: number;
  disabled?: boolean;
};

export function GenerateActIspdnDocumentForm({ ispdnId, disabled = false }: GenerateActIspdnDocumentFormProps) {
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ActIspdnCommissioningFormValues>({
    resolver: zodResolver(actIspdnCommissioningSchema),
    defaultValues: {
      descriptionOfViolationsAndDisadvantages: "Недостатки не выявлены",
      recommendation: "Допустить ИСПДн к эксплуатации",
      events: [{ controlEventId: null, responsibleEmployeeId: null }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "events",
  });

  const mutation = useMutation({
    mutationFn: (values: ActIspdnCommissioningFormValues) => generateIspdnDocument(ispdnId, mapToPayload(values)),
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
        {mutation.isError && (
          <Alert severity="error">
            Не удалось сформировать документ. Проверьте данные формы, доступность backend API и наличие системного
            шаблона.
          </Alert>
        )}
        {downloadError && <Alert severity="error">{downloadError}</Alert>}
        {mutation.isSuccess && !downloadError && <Alert severity="success">Документ сформирован и передан на скачивание.</Alert>}

        <Stack spacing={2}>
          <Box>
            <Typography component="h3" variant="h6" sx={{ fontWeight: 600 }}>
              Ручные данные
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Эти поля попадут в системный шаблон акта. Номер мероприятия backend назначит автоматически.
            </Typography>
          </Box>
          <TextField
            label="Обнаруженные нарушения и недостатки"
            multiline
            minRows={4}
            disabled={disabled || mutation.isPending}
            error={Boolean(errors.descriptionOfViolationsAndDisadvantages)}
            helperText={errors.descriptionOfViolationsAndDisadvantages?.message}
            {...register("descriptionOfViolationsAndDisadvantages")}
          />
          <TextField
            label="Рекомендации"
            multiline
            minRows={3}
            disabled={disabled || mutation.isPending}
            error={Boolean(errors.recommendation)}
            helperText={errors.recommendation?.message}
            {...register("recommendation")}
          />
        </Stack>

        <Divider />

        <Stack spacing={2}>
          <Box>
            <Typography component="h3" variant="h6" sx={{ fontWeight: 600 }}>
              Проведённые мероприятия
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Выберите контрольное мероприятие из реестра и ответственного сотрудника для каждого пункта.
            </Typography>
          </Box>

          {errors.events?.root?.message && <Alert severity="error">{errors.events.root.message}</Alert>}

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
                    <Typography sx={{ fontWeight: 600 }}>Мероприятие {index + 1}</Typography>
                    <Button
                      type="button"
                      variant="outlined"
                      color="inherit"
                      startIcon={<DeleteIcon />}
                      disabled={disabled || mutation.isPending || fields.length === 1}
                      onClick={() => remove(index)}
                    >
                      Удалить мероприятие
                    </Button>
                  </Stack>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <Controller
                      name={`events.${index}.controlEventId`}
                      control={control}
                      render={({ field: controlEventField }) => (
                        <ControlEventSelect
                          value={controlEventField.value}
                          onChange={controlEventField.onChange}
                          label="Контрольное мероприятие"
                          required
                          allowQuickCreate
                          quickCreateButtonPlacement="below"
                          quickCreateButtonLabel="Создать мероприятие"
                          disabled={disabled || mutation.isPending}
                          error={Boolean(errors.events?.[index]?.controlEventId)}
                          helperText={errors.events?.[index]?.controlEventId?.message}
                        />
                      )}
                    />
                    <Controller
                      name={`events.${index}.responsibleEmployeeId`}
                      control={control}
                      render={({ field: responsibleField }) => (
                        <EmployeeSelect
                          value={responsibleField.value}
                          onChange={responsibleField.onChange}
                          label="Ответственный за мероприятие"
                          required
                          allowQuickCreate
                          disabled={disabled || mutation.isPending}
                          error={Boolean(errors.events?.[index]?.responsibleEmployeeId)}
                          helperText={errors.events?.[index]?.responsibleEmployeeId?.message}
                        />
                      )}
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
            disabled={disabled || mutation.isPending}
            onClick={() => append({ controlEventId: null, responsibleEmployeeId: null })}
            sx={{ alignSelf: "flex-start" }}
          >
            Добавить мероприятие
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
