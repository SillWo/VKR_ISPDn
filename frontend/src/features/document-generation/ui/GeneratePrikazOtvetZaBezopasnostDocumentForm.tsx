import DownloadIcon from "@mui/icons-material/Download";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Box, Button, Stack, TextField } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { forwardRef, useImperativeHandle, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { generateIspdnDocument } from "../../../entities/document/api/documentApi";
import type {
  GeneratedDocumentFile,
  GenerateIspdnDocumentPayload,
  PrikazOtvetZaBezopasnostDocumentFormValues,
} from "../../../entities/document/model/types";
import { HttpError } from "../../../shared/api/httpClient";
import { requiredText } from "../../../shared/lib/validation";

const prikazOtvetZaBezopasnostDocumentSchema = z.object({
  orderNumber: requiredText("Укажите номер приказа"),
});

function mapToPayload(values: PrikazOtvetZaBezopasnostDocumentFormValues): GenerateIspdnDocumentPayload {
  return {
    documentType: "prikaz_otvet_za_bezopasnost",
    manualData: {
      order_number: values.orderNumber.trim(),
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
  return "Не удалось сформировать документ. Проверьте номер приказа, данные карточки ИСПДн, карточки организации и наличие системного шаблона.";
}

type GeneratePrikazOtvetZaBezopasnostDocumentFormProps = {
  ispdnId: number;
  disabled?: boolean;
  showSubmitButton?: boolean;
  onGenerated?: () => void;
};

export type GeneratePrikazOtvetZaBezopasnostDocumentFormHandle = {
  generate: () => Promise<void>;
  prepare: () => Promise<GeneratedDocumentFile>;
  getPayload: () => Promise<GenerateIspdnDocumentPayload>;
};

export const GeneratePrikazOtvetZaBezopasnostDocumentForm = forwardRef<
  GeneratePrikazOtvetZaBezopasnostDocumentFormHandle,
  GeneratePrikazOtvetZaBezopasnostDocumentFormProps
>(function GeneratePrikazOtvetZaBezopasnostDocumentForm({
  ispdnId,
  disabled = false,
  showSubmitButton = true,
  onGenerated,
}: GeneratePrikazOtvetZaBezopasnostDocumentFormProps, ref) {
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PrikazOtvetZaBezopasnostDocumentFormValues>({
    resolver: zodResolver(prikazOtvetZaBezopasnostDocumentSchema),
    defaultValues: {
      orderNumber: "",
    },
  });

  const generateFile = async (values: PrikazOtvetZaBezopasnostDocumentFormValues) => {
    setDownloadError(null);
    return generateIspdnDocument(ispdnId, mapToPayload(values));
  };

  const mutation = useMutation({
    mutationFn: async (values: PrikazOtvetZaBezopasnostDocumentFormValues) => {
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
          () => reject(new Error("Проверьте номер приказа.")),
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
          () => reject(new Error("Проверьте номер приказа.")),
        )();
      }),
    getPayload: () =>
      new Promise<GenerateIspdnDocumentPayload>((resolve, reject) => {
        void handleSubmit(
          (values) => resolve(mapToPayload(values)),
          () => reject(new Error("Проверьте номер приказа.")),
        )();
      }),
  }));

  const submitForm = handleSubmit((values) => {
    mutation.mutate(values);
  });

  return (
    <Box component="form" onSubmit={submitForm}>
      <Stack spacing={3}>
        {mutation.isError && <Alert severity="error">{getGenerationErrorMessage(mutation.error)}</Alert>}
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
