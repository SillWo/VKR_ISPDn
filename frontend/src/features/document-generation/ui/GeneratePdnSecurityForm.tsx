import DownloadIcon from "@mui/icons-material/Download";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { generateGlobalDocument } from "../../../entities/document/api/documentApi";
import type {
  GenerateGlobalDocumentPayload,
  PdnSecurityFormValues,
} from "../../../entities/document/model/types";
import { HttpError } from "../../../shared/api/httpClient";
import { requiredText } from "../../../shared/lib/validation";

const pdnSecuritySchema = z.object({
  orderNumber: requiredText("Укажите номер приказа"),
});

function mapToPayload(values: PdnSecurityFormValues): GenerateGlobalDocumentPayload {
  return {
    documentType: "PDn_security",
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
  return "Не удалось сформировать документ. Проверьте данные формы, доступность backend API и наличие системного шаблона.";
}

export function GeneratePdnSecurityForm() {
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PdnSecurityFormValues>({
    resolver: zodResolver(pdnSecuritySchema),
    defaultValues: {
      orderNumber: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: PdnSecurityFormValues) => generateGlobalDocument(mapToPayload(values)),
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
              Ручные данные
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Номер приказа будет подставлен в системный шаблон положения о защите персональных данных.
            </Typography>
          </Box>

          <TextField
            label="Номер приказа"
            disabled={disabled}
            error={Boolean(errors.orderNumber)}
            helperText={errors.orderNumber?.message}
            {...register("orderNumber")}
          />
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
