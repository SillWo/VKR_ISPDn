import { z } from "zod";

import type { OrganizationFormValues } from "../../../entities/organization/model/types";
import { requiredText } from "../../../shared/lib/validation";

const digits = (length: number, label: string) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, `${label} должен состоять только из цифр`)
    .length(length, `${label} должен содержать ${length} символов`);

const optionalText = z.string().trim();
const terminationTypeSchema = z.enum(["end_date", "end_condition", ""]);
const optionalStatisticalCode = z.string().trim().max(32, "Значение должно быть не длиннее 32 символов");
const optionalPhone = z
  .string()
  .trim()
  .refine((value) => !value || /^\+7\(\d{3}\)\d{3}-\d{2}-\d{2}$/.test(value), {
    message: "Укажите номер в формате +7(999)999-99-99",
  });

export const organizationCardFormSchema = z
  .object({
    shortLegalName: requiredText("Укажите сокращённое название юр.лица"),
    fullLegalName: requiredText("Укажите полное название юр.лица"),
    inn: digits(10, "ИНН"),
    ogrn: digits(13, "ОГРН"),
    kpp: digits(9, "КПП"),
    headEmployeeId: z.number().nullable(),
    registrationAddress: requiredText("Укажите адрес регистрации"),
    registrationCity: requiredText("Укажите город регистрации"),
    operatorType: z
      .enum([
        "legal_entity",
        "individual_entrepreneur",
        "state_body",
        "municipal_body",
        "branch",
        "foreign_citizen",
        "",
      ]),
    headOfficeRegion: z.string().trim().max(255, "Значение должно быть не длиннее 255 символов"),
    activityRegions: optionalText,
    postalAddressMatchesRegistration: z.boolean(),
    postalAddress: optionalText,
    phone: optionalPhone,
    fax: optionalPhone,
    email: z.string().trim().refine((value) => !value || z.email().safeParse(value).success, {
      message: "Укажите корректный адрес электронной почты",
    }),
    okpo: optionalStatisticalCode,
    okfs: optionalStatisticalCode,
    okogu: optionalStatisticalCode,
    okopf: optionalStatisticalCode,
    documentApproverEmployeeId: z.number().nullable(),
    informationSecurityResponsibleEmployeeId: z.number().nullable(),
    personalDataProcessingResponsibleEmployeeId: z.number().nullable(),
    personalDataProcessingTerminationType: terminationTypeSchema,
    personalDataProcessingTerminationDate: z.string(),
    personalDataProcessingTerminationCondition: optionalText,
    okveds: z.array(
      z.object({
        code: requiredText("Укажите код ОКВЭД").max(32, "Код должен быть не длиннее 32 символов"),
        name: requiredText("Укажите наименование ОКВЭД"),
      }),
    ),
    branches: z.array(
      z.object({
        name: requiredText("Укажите наименование филиала").max(255, "Наименование должно быть не длиннее 255 символов"),
        postalAddress: requiredText("Укажите почтовый адрес филиала"),
      }),
    ),
  })
  .superRefine((values, ctx) => {
    if (!values.postalAddressMatchesRegistration && !values.postalAddress.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["postalAddress"],
        message: "Укажите почтовый адрес",
      });
    }
    if (values.headEmployeeId === null) {
      ctx.addIssue({
        code: "custom",
        path: ["headEmployeeId"],
        message: "Выберите руководителя из реестра сотрудников",
      });
    }
    if (!values.personalDataProcessingTerminationType) {
      ctx.addIssue({
        code: "custom",
        path: ["personalDataProcessingTerminationType"],
        message: "Выберите срок или условие прекращения обработки ПДн",
      });
    }
    if (values.personalDataProcessingTerminationType === "end_date" && !values.personalDataProcessingTerminationDate) {
      ctx.addIssue({
        code: "custom",
        path: ["personalDataProcessingTerminationDate"],
        message: "Укажите дату прекращения обработки ПДн",
      });
    }
    if (
      values.personalDataProcessingTerminationType === "end_condition" &&
      !values.personalDataProcessingTerminationCondition.trim()
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["personalDataProcessingTerminationCondition"],
        message: "Укажите условие окончания прекращения обработки ПДн",
      });
    }
  });

export const defaultOrganizationFormValues: OrganizationFormValues = {
  shortLegalName: "",
  fullLegalName: "",
  inn: "",
  ogrn: "",
  kpp: "",
  headEmployeeId: null,
  registrationAddress: "",
  registrationCity: "",
  operatorType: "",
  headOfficeRegion: "",
  activityRegions: "",
  postalAddressMatchesRegistration: true,
  postalAddress: "",
  phone: "",
  fax: "",
  email: "",
  okpo: "",
  okfs: "",
  okogu: "",
  okopf: "",
  documentApproverEmployeeId: null,
  informationSecurityResponsibleEmployeeId: null,
  personalDataProcessingResponsibleEmployeeId: null,
  personalDataProcessingTerminationType: "",
  personalDataProcessingTerminationDate: "",
  personalDataProcessingTerminationCondition: "",
  okveds: [],
  branches: [],
};
