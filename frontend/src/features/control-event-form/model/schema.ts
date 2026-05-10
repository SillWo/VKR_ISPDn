import { z } from "zod";

export const controlEventFormSchema = z.object({
  name: z.string().trim().min(1, "Укажите название контрольного мероприятия.").max(255, "Не более 255 символов."),
  description: z.string().trim().min(1, "Укажите описание контрольного мероприятия."),
});

export const defaultControlEventFormValues = {
  name: "",
  description: "",
};
