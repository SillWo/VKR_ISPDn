import { z } from "zod";

import { requiredText } from "../../../shared/lib/validation";

const ispdnCardBaseSchema = z.object({
  name: requiredText("Укажите название ИСПДн"),
  shortDescription: requiredText("Заполните краткое описание"),
  processingPurposes: z.string(),
  processingPurposeIds: z.array(z.number()),
  commissioningDate: requiredText("Укажите дату ввода в работу"),
  decommissioningDate: z.string(),
  websiteUrl: z
    .string()
    .trim()
    .refine((value) => value === "" || z.url().safeParse(value).success, "Укажите корректный URL"),
  responsibleEmployeeId: z.number().nullable(),
  systemComposition: requiredText("Опишите состав ИСПДн"),
  status: z.enum(["active", "archived"]),
});

const withRequiredCardFields = (schema: typeof ispdnCardBaseSchema) =>
  schema
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

export const ispdnCardFormSchema = withRequiredCardFields(
  ispdnCardBaseSchema.refine((values) => values.processingPurposeIds.length > 0, {
    message: "Добавьте хотя бы одну цель обработки",
    path: ["processingPurposeIds"],
  }),
);

export const ispdnCardMainInfoFormSchema = withRequiredCardFields(ispdnCardBaseSchema);

export type IspdnCardFormSchema = z.infer<typeof ispdnCardFormSchema>;

export const defaultIspdnFormValues: IspdnCardFormSchema = {
  name: "",
  shortDescription: "",
  processingPurposes: "",
  processingPurposeIds: [],
  commissioningDate: "",
  decommissioningDate: "",
  websiteUrl: "",
  responsibleEmployeeId: null,
  systemComposition: "",
  status: "active",
};
