import { z } from "zod";

import { requiredText } from "../../../shared/lib/validation";
const digits = (length: number, label: string) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, `${label} должен состоять только из цифр`)
    .length(length, `${label} должен содержать ${length} символов`);

export const organizationCardFormSchema = z.object({
  shortLegalName: requiredText("Укажите сокращённое название юр.лица"),
  fullLegalName: requiredText("Укажите полное название юр.лица"),
  inn: digits(10, "ИНН"),
  ogrn: digits(13, "ОГРН"),
  kpp: digits(9, "КПП"),
  headFullName: requiredText("Укажите ФИО руководителя"),
  headPosition: requiredText("Укажите должность руководителя"),
  registrationAddress: requiredText("Укажите адрес регистрации"),
  registrationCity: requiredText("Укажите город регистрации"),
});

export type OrganizationCardFormSchema = z.infer<typeof organizationCardFormSchema>;

export const defaultOrganizationFormValues: OrganizationCardFormSchema = {
  shortLegalName: "",
  fullLegalName: "",
  inn: "",
  ogrn: "",
  kpp: "",
  headFullName: "",
  headPosition: "",
  registrationAddress: "",
  registrationCity: "",
};
