import { z } from "zod";

import type { DataCenterFormValues } from "../../../entities/data-center/model/types";

const ownerTypeSchema = z.enum([
  "individual",
  "foreign_organization",
  "individual_entrepreneur",
  "legal_entity",
]);

const requiredText = (message: string) => z.string().trim().min(1, message);
const optionalText = z.string();

export const dataCenterOwnerTypeLabels = {
  individual: "Физическое лицо",
  foreign_organization: "Иностранная организация",
  individual_entrepreneur: "Индивидуальный предприниматель",
  legal_entity: "Юридическое лицо",
} as const;

export const dataCenterFormSchema = z
  .object({
    name: requiredText("Укажите название ЦОД.").max(255, "Не более 255 символов."),
    locationCountry: requiredText("Укажите страну расположения ЦОД.").max(255, "Не более 255 символов."),
    locationAddress: requiredText("Укажите адрес местонахождения ЦОД.").max(1000, "Не более 1000 символов."),
    isOwnDataCenter: z.boolean(),
    ownerOrganizationType: z.union([ownerTypeSchema, z.literal("")]),
    ownerPersonFullName: optionalText,
    ownerOrganizationName: optionalText,
    ownerOgrnip: optionalText,
    ownerOgrn: optionalText,
    ownerInn: optionalText,
    ownerLocationCountry: optionalText,
    ownerLocationAddress: optionalText,
  })
  .superRefine((values, ctx) => {
    if (values.isOwnDataCenter) {
      return;
    }

    if (!values.ownerOrganizationType) {
      ctx.addIssue({
        code: "custom",
        path: ["ownerOrganizationType"],
        message: "Выберите тип организации.",
      });
    }

    if (!values.ownerLocationCountry.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["ownerLocationCountry"],
        message: "Укажите страну местонахождения ответственной организации.",
      });
    }

    if (!values.ownerLocationAddress.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["ownerLocationAddress"],
        message: "Укажите адрес местонахождения ответственной организации.",
      });
    }

    if (values.ownerOrganizationType === "individual") {
      requireField(ctx, values.ownerPersonFullName, "ownerPersonFullName", "Укажите ФИО физического лица.");
      requireField(ctx, values.ownerInn, "ownerInn", "Укажите ИНН физического лица.");
    }

    if (values.ownerOrganizationType === "individual_entrepreneur") {
      requireField(ctx, values.ownerPersonFullName, "ownerPersonFullName", "Укажите ФИО индивидуального предпринимателя.");
      requireField(ctx, values.ownerOgrnip, "ownerOgrnip", "Укажите ОГРНИП.");
      requireField(ctx, values.ownerInn, "ownerInn", "Укажите ИНН.");
    }

    if (values.ownerOrganizationType === "legal_entity") {
      requireField(ctx, values.ownerOrganizationName, "ownerOrganizationName", "Укажите наименование юридического лица.");
      requireField(ctx, values.ownerOgrn, "ownerOgrn", "Укажите ОГРН.");
      requireField(ctx, values.ownerInn, "ownerInn", "Укажите ИНН.");
    }

    if (values.ownerOrganizationType === "foreign_organization") {
      requireField(ctx, values.ownerOrganizationName, "ownerOrganizationName", "Укажите наименование иностранной организации.");
    }
  });

export const defaultDataCenterFormValues: DataCenterFormValues = {
  name: "",
  locationCountry: "",
  locationAddress: "",
  isOwnDataCenter: true,
  ownerOrganizationType: "",
  ownerPersonFullName: "",
  ownerOrganizationName: "",
  ownerOgrnip: "",
  ownerOgrn: "",
  ownerInn: "",
  ownerLocationCountry: "",
  ownerLocationAddress: "",
};

function requireField(
  ctx: z.RefinementCtx,
  value: string,
  path: string,
  message: string,
) {
  if (!value.trim()) {
    ctx.addIssue({ code: "custom", path: [path], message });
  }
}
