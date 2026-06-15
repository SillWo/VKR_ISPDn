import { z } from "zod";

import { requiredText } from "../../../shared/lib/validation";

const ispdnCardBaseSchema = z.object({
  name: requiredText("Укажите название ИСПДн"),
  shortDescription: requiredText("Заполните краткое описание"),
  commissioningDate: requiredText("Укажите дату ввода в работу"),
  decommissioningDate: z.string(),
  websiteUrl: z
    .string()
    .trim()
    .refine((value) => value === "" || z.url().safeParse(value).success, "Укажите корректный URL"),
  responsibleEmployeeId: z.number().nullable(),
  systemComposition: z
    .array(
      z.object({
        name: requiredText("Укажите наименование элемента состава ИСПДн"),
        description: requiredText("Укажите описание элемента состава ИСПДн"),
      }),
    )
    .min(1, "Добавьте минимум один элемент состава ИСПДн"),
  securityTools: z.object({
    dlp: z.boolean(),
    siem: z.boolean(),
    antivirus: z.boolean(),
    ipsIds: z.boolean(),
    firewallUtmNgfw: z.boolean(),
    vulnerabilityScanner: z.boolean(),
    backupSystem: z.boolean(),
    trustedBoot: z.boolean(),
    accessControl: z.boolean(),
    physicalSecurity: z.boolean(),
    otherSecurityTools: z.string().nullable(),
  }),
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

export const ispdnCardFormSchema = withRequiredCardFields(ispdnCardBaseSchema);

export const ispdnCardMainInfoFormSchema = withRequiredCardFields(ispdnCardBaseSchema);

export type IspdnCardFormSchema = z.infer<typeof ispdnCardFormSchema>;

export const defaultIspdnFormValues: IspdnCardFormSchema = {
  name: "",
  shortDescription: "",
  commissioningDate: "",
  decommissioningDate: "",
  websiteUrl: "",
  responsibleEmployeeId: null,
  systemComposition: [
    {
      name: "",
      description: "",
    },
  ],
  securityTools: {
    dlp: false,
    siem: false,
    antivirus: false,
    ipsIds: false,
    firewallUtmNgfw: false,
    vulnerabilityScanner: false,
    backupSystem: false,
    trustedBoot: false,
    accessControl: false,
    physicalSecurity: false,
    otherSecurityTools: "",
  },
  status: "active",
};
