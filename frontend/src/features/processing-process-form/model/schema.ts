import { z } from "zod";

import {
  createEmptyDataCategoryValues,
  createEmptyPersonalDataActionValues,
  createEmptySwitchValues,
  legalBasisCatalog,
  subjectCategoryCatalog,
} from "../../../entities/processing-process/model/catalogs";
import type { ProcessingProcessFormValues } from "../../../entities/processing-process/model/types";

const switchGroupSchema = z.record(z.string(), z.boolean()).refine((values) => Object.values(values).some(Boolean), {
  message: "Выберите хотя бы один пункт.",
});

const personalDataActionSchema = z
  .record(z.string(), z.union([z.boolean(), z.string()]))
  .refine(
    (values) =>
      Object.entries(values).some(([key, value]) =>
        key === "other_actions" ? typeof value === "string" && value.trim() !== "" : value === true,
      ),
    { message: "Выберите хотя бы одно действие или заполните поле иных действий." },
  );

const dataCategorySchema = z
  .record(z.string(), z.union([z.boolean(), z.string()]))
  .refine(
    (values) =>
      Object.entries(values).some(([key, value]) =>
        key === "other_personal_data" || key === "other_biometric_data"
          ? typeof value === "string" && value.trim() !== ""
          : value === true,
      ),
    { message: "Выберите хотя бы одну категорию данных или заполните поле иных данных." },
  );

export const processingProcessFormSchema = z.object({
  name: z.string().trim().min(1, "Укажите наименование процесса обработки."),
  purposeName: z.string().trim().min(1, "Укажите цель обработки."),
  processingPeriod: z.string().trim().min(1, "Укажите период обработки."),
  subjectCategories: switchGroupSchema,
  dataCategories: dataCategorySchema,
  legalBases: switchGroupSchema,
  personalDataActions: personalDataActionSchema,
  processingType: z
    .union([z.enum(["automated", "non_automated", "mixed"]), z.literal("")])
    .refine((value) => value !== "", { message: "Выберите тип обработки." }),
  internalNetworkTransfer: z
    .union([z.enum(["no_internal_network_transfer", "with_internal_network_transfer"]), z.literal("")])
    .refine((value) => value !== "", { message: "Выберите вариант передачи по внутренней сети." }),
  internetTransfer: z
    .union([z.enum(["no_internet_transfer", "with_internet_transfer"]), z.literal("")])
    .refine((value) => value !== "", { message: "Выберите вариант передачи по сети Интернет." }),
  crossBorderTransfer: z.boolean({ error: "Укажите наличие трансграничной передачи." }),
});

export const defaultProcessingProcessFormValues: ProcessingProcessFormValues = {
  name: "",
  purposeName: "",
  processingPeriod: "",
  subjectCategories: createEmptySwitchValues(subjectCategoryCatalog),
  dataCategories: createEmptyDataCategoryValues(),
  legalBases: createEmptySwitchValues(legalBasisCatalog),
  personalDataActions: createEmptyPersonalDataActionValues(),
  processingType: "",
  internalNetworkTransfer: "",
  internetTransfer: "",
  crossBorderTransfer: false,
};
