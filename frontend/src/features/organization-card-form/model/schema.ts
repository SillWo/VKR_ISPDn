import { z } from "zod";

import type { OrganizationFormValues } from "../../../entities/organization/model/types";
import { requiredText } from "../../../shared/lib/validation";

const optionalText = z.string().trim();
const optionalDigits = (label: string) =>
  z
    .string()
    .trim()
    .refine((value) => !value || /^\d+$/.test(value), `${label} должен состоять только из цифр`);
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
    shortLegalName: optionalText,
    fullLegalName: requiredText("Укажите полное название организации"),
    inn: z.string().trim().regex(/^\d+$/, "ИНН должен состоять только из цифр"),
    ogrn: z.string().trim().regex(/^\d+$/, "ОГРН/ОГРНИП должен состоять только из цифр"),
    kpp: z.string().trim(),
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
    identityDocumentType: z.enum(["passport_rf", "other_rf_document", ""]),
    identityDocumentName: optionalText,
    identityDocumentSeries: optionalDigits("Серия"),
    identityDocumentNumber: optionalDigits("Номер"),
    identityDocumentIssuedBy: optionalText,
    identityDocumentIssuedDate: z.string(),
    headOfficeRegion: z.string().trim().max(255, "Значение должно быть не длиннее 255 символов"),
    activityRegions: optionalText,
    rknOfficeAddress: requiredText("Укажите адрес офиса Роскомнадзора"),
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
    if (["legal_entity", "state_body", "municipal_body"].includes(values.operatorType) && !values.shortLegalName.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["shortLegalName"],
        message: "Укажите сокращённое название организации",
      });
    }
    if (["legal_entity", "state_body", "municipal_body"].includes(values.operatorType)) {
      if (values.inn.length !== 10) {
        ctx.addIssue({
          code: "custom",
          path: ["inn"],
          message: "ИНН юр.лица должен содержать 10 цифр",
        });
      }
      if (values.ogrn.length !== 13) {
        ctx.addIssue({
          code: "custom",
          path: ["ogrn"],
          message: "ОГРН юр.лица должен содержать 13 цифр",
        });
      }
      if (!/^\d{9}$/.test(values.kpp)) {
        ctx.addIssue({
          code: "custom",
          path: ["kpp"],
          message: "КПП юр.лица должен содержать 9 цифр",
        });
      }
    }
    if (values.operatorType === "individual_entrepreneur") {
      if (values.inn.length !== 12) {
        ctx.addIssue({
          code: "custom",
          path: ["inn"],
          message: "ИНН ИП должен содержать 12 цифр",
        });
      }
      if (values.ogrn.length !== 15) {
        ctx.addIssue({
          code: "custom",
          path: ["ogrn"],
          message: "ОГРНИП должен содержать 15 цифр",
        });
      }
      if (!values.identityDocumentType) {
        ctx.addIssue({
          code: "custom",
          path: ["identityDocumentType"],
          message: "Выберите документ, удостоверяющий личность",
        });
      }
      if (values.identityDocumentType === "other_rf_document" && !values.identityDocumentName.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["identityDocumentName"],
          message: "Укажите документ",
        });
      }
      if (!values.identityDocumentSeries.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["identityDocumentSeries"],
          message: "Укажите серию",
        });
      }
      if (!values.identityDocumentNumber.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["identityDocumentNumber"],
          message: "Укажите номер",
        });
      }
      if (!values.identityDocumentIssuedBy.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["identityDocumentIssuedBy"],
          message: "Укажите, кем выдан документ",
        });
      }
      if (!values.identityDocumentIssuedDate) {
        ctx.addIssue({
          code: "custom",
          path: ["identityDocumentIssuedDate"],
          message: "Укажите дату выдачи",
        });
      }
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
  identityDocumentType: "",
  identityDocumentName: "",
  identityDocumentSeries: "",
  identityDocumentNumber: "",
  identityDocumentIssuedBy: "",
  identityDocumentIssuedDate: "",
  headOfficeRegion: "",
  activityRegions: "",
  rknOfficeAddress: "",
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
