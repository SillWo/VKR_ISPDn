import { z } from "zod";

import type { CryptoToolFormValues } from "../../../entities/crypto-tool/model/types";

export const cryptoToolClassLabels = {
  KS1: "КС1",
  KS2: "КС2",
  KS3: "КС3",
  KV: "КВ",
  KA: "КА",
} as const;

export const cryptoToolClassOptions = Object.entries(cryptoToolClassLabels).map(([value, label]) => ({
  value: value as keyof typeof cryptoToolClassLabels,
  label,
}));

const requiredText = (message: string) => z.string().trim().min(1, message);

export const cryptoToolFormSchema = z.object({
  name: requiredText("Укажите наименование СКЗИ."),
  cryptoClass: z.enum(["KS1", "KS2", "KS3", "KV", "KA"], {
    message: "Выберите класс СКЗИ.",
  }),
  manufacturer: requiredText("Укажите изготовителя."),
  serialNumber: requiredText("Укажите серийный номер."),
});

export const defaultCryptoToolFormValues: CryptoToolFormValues = {
  name: "",
  cryptoClass: "",
  manufacturer: "",
  serialNumber: "",
};
