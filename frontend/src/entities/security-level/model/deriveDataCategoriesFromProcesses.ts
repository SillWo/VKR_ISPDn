import { dataCategoryGroups } from "../../processing-process/model/catalogs";
import type { ProcessingProcess } from "../../processing-process/model/types";
import type { SecurityLevelDataCategories } from "./types";

const personalDataKeys = new Set([
  ...dataCategoryGroups[0].items.map((item) => item.key),
  ...(dataCategoryGroups[0].textItems ?? []).map((item) => item.key),
]);

const specialDataKeys = new Set(dataCategoryGroups[1].items.map((item) => item.key));

const biometricDataKeys = new Set([
  ...dataCategoryGroups[2].items.map((item) => item.key),
  ...(dataCategoryGroups[2].textItems ?? []).map((item) => item.key),
]);

function isSelected(value: boolean | string | undefined) {
  return value === true || (typeof value === "string" && value.trim() !== "");
}

function hasAnySelectedDataCategory(process: ProcessingProcess, keys: Set<string>) {
  return Object.entries(process.dataCategories).some(([key, value]) => keys.has(key) && isSelected(value));
}

export function deriveSecurityLevelDataCategoriesFromProcesses(
  processes: ProcessingProcess[],
): Pick<SecurityLevelDataCategories, "special" | "biometric" | "other"> {
  return {
    special: processes.some((process) => hasAnySelectedDataCategory(process, specialDataKeys)),
    biometric: processes.some((process) => hasAnySelectedDataCategory(process, biometricDataKeys)),
    other: processes.some((process) => hasAnySelectedDataCategory(process, personalDataKeys)),
  };
}
