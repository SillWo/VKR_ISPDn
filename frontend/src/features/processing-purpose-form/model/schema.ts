import { z } from "zod";

export const processingPurposeFormSchema = z.object({
  name: z.string().trim().min(1, "Укажите название цели обработки.").max(255, "Не более 255 символов."),
  processingPeriod: z
    .string()
    .trim()
    .min(1, "Укажите период обработки.")
    .max(1000, "Не более 1000 символов."),
});

export const defaultProcessingPurposeFormValues = {
  name: "",
  processingPeriod: "",
};
