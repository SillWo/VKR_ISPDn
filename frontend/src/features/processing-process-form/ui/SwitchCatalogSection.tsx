import { Alert, Checkbox, FormControlLabel, FormGroup, Stack } from "@mui/material";
import { Controller, type Control, type FieldErrors, type FieldPath } from "react-hook-form";

import type { CatalogItem } from "../../../entities/processing-process/model/catalogs";
import type { ProcessingProcessFormValues } from "../../../entities/processing-process/model/types";

type SwitchCatalogSectionProps = {
  catalog: CatalogItem[];
  fieldName: "subjectCategories" | "dataCategories" | "legalBases" | "personalDataActions";
  control: Control<ProcessingProcessFormValues>;
  errors: FieldErrors<ProcessingProcessFormValues>;
};

export function SwitchCatalogSection({ catalog, fieldName, control, errors }: SwitchCatalogSectionProps) {
  const errorMessage = errors[fieldName]?.message;

  return (
    <Stack spacing={2}>
      {errorMessage && <Alert severity="error">{String(errorMessage)}</Alert>}
      <FormGroup
        sx={{
          display: "grid",
          gridTemplateColumns: catalog.length >= 4 ? { xs: "1fr", md: "1fr 1fr" } : "1fr",
          columnGap: 2,
          rowGap: 0.5,
        }}
      >
        {catalog.map((item) => (
          <Controller
            key={item.key}
            name={`${fieldName}.${item.key}` as FieldPath<ProcessingProcessFormValues>}
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={Boolean(field.value)}
                    onChange={(event) => field.onChange(event.target.checked)}
                  />
                }
                label={item.label}
                sx={{
                  m: 0,
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  alignItems: "flex-start",
                  "& .MuiCheckbox-root": { py: 0.25 },
                  "& .MuiFormControlLabel-label": { lineHeight: 1.45 },
                }}
              />
            )}
          />
        ))}
      </FormGroup>
    </Stack>
  );
}
