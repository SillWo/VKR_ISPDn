import type { FieldPath, FieldValues, UseFormTrigger } from "react-hook-form";

export async function findFirstInvalidTab<TFieldValues extends FieldValues>(
  trigger: UseFormTrigger<TFieldValues>,
  tabFieldNames: FieldPath<TFieldValues>[][],
) {
  for (const [index, fields] of tabFieldNames.entries()) {
    if (fields.length === 0) {
      continue;
    }
    const isValid = await trigger(fields, { shouldFocus: true });
    if (!isValid) {
      return index;
    }
  }
  return -1;
}

export function scrollTabContainerToTop(elementId: string) {
  document.getElementById(elementId)?.scrollIntoView({ block: "start" });
}
