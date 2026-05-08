import { z } from "zod";

import { createEmptySecurityLevelDataCategories } from "../../../entities/security-level/model/catalogs";
import type { SecurityLevelFormValues } from "../../../entities/security-level/model/types";

const allowedExtensions = [".pdf", ".docx"];

export const securityLevelFormSchema = z
  .object({
    dataCategories: z
      .object({
        special: z.boolean(),
        biometric: z.boolean(),
        public: z.boolean(),
        other: z.boolean(),
      })
      .refine((values) => Object.values(values).some(Boolean), {
        message: "Выберите хотя бы одну категорию данных.",
      }),
    subjectCountRange: z
      .union([z.enum(["more_than_100k", "less_than_100k"]), z.literal("")])
      .refine((value) => value !== "", { message: "Выберите количество субъектов ПДн." }),
    threatType: z
      .union([z.enum(["threat_type_1", "threat_type_2", "threat_type_3"]), z.literal("")])
      .refine((value) => value !== "", {
        message: "Выберите тип актуальных угроз.",
      }),
    subjectGroup: z
      .union([z.enum(["clients_only", "employees_only", "employees_and_clients"]), z.literal("")])
      .refine((value) => value !== "", { message: "Выберите группы субъектов ПДн." }),
    recommendedLevel: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.null()]),
    actualLevel: z
      .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal("")])
      .refine((value) => value !== "", { message: "Выберите фактический уровень защищённости." }),
    deviationJustificationText: z.string(),
    deviationJustificationFile: z.instanceof(File).nullable(),
  })
  .superRefine((values, context) => {
    if (values.deviationJustificationFile) {
      const fileName = values.deviationJustificationFile.name.toLowerCase();
      if (!allowedExtensions.some((extension) => fileName.endsWith(extension))) {
        context.addIssue({
          code: "custom",
          path: ["deviationJustificationFile"],
          message: "Файл обоснования должен быть в формате .pdf или .docx.",
        });
      }
    }

    if (
      values.recommendedLevel !== null &&
      values.actualLevel !== values.recommendedLevel &&
      !values.deviationJustificationText.trim() &&
      !values.deviationJustificationFile
    ) {
      context.addIssue({
        code: "custom",
        path: ["deviationJustificationText"],
        message: "Укажите текстовое обоснование или приложите файл.",
      });
    }
  });

export const defaultSecurityLevelFormValues: SecurityLevelFormValues = {
  dataCategories: createEmptySecurityLevelDataCategories(),
  subjectCountRange: "",
  threatType: "",
  subjectGroup: "",
  recommendedLevel: null,
  actualLevel: "",
  deviationJustificationText: "",
  deviationJustificationFile: null,
};
