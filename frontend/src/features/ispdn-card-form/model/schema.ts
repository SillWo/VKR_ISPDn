import { z } from "zod";

import { requiredText } from "../../../shared/lib/validation";

export const ispdnCardFormSchema = z
  .object({
    name: requiredText("Укажите название ИСПДн"),
    shortDescription: requiredText("Заполните краткое описание"),
    processingPurposes: requiredText("Укажите цели обработки ПДн"),
    commissioningDate: requiredText("Укажите дату ввода в работу"),
    decommissioningDate: z.string(),
    websiteUrl: z
      .string()
      .trim()
      .refine((value) => value === "" || z.url().safeParse(value).success, "Укажите корректный URL"),
    responsibleEmployeeId: z.number().nullable(),
    systemComposition: requiredText("Опишите состав ИСПДн"),
    status: z.enum(["active", "archived"]),
  })
  .refine((values) => values.responsibleEmployeeId !== null, {
    message: "Выберите ответственного сотрудника из реестра",
    path: ["responsibleEmployeeId"],
  })
  .refine(
    (values) =>
      !values.decommissioningDate ||
      !values.commissioningDate ||
      values.decommissioningDate >= values.commissioningDate,
    {
      message: "Дата вывода не может быть раньше даты ввода",
      path: ["decommissioningDate"],
    },
  );

export type IspdnCardFormSchema = z.infer<typeof ispdnCardFormSchema>;

export const defaultIspdnFormValues: IspdnCardFormSchema = {
  name: "",
  shortDescription: "",
  processingPurposes: "",
  commissioningDate: "",
  decommissioningDate: "",
  websiteUrl: "",
  responsibleEmployeeId: null,
  systemComposition: "",
  status: "active",
};
