import { Alert, Box, Divider, FormControlLabel, Stack, Switch, Typography } from "@mui/material";
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
      <Stack
        divider={<Divider flexItem />}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          bgcolor: "background.paper",
        }}
      >
        {catalog.map((item) => (
          <Controller
            key={item.key}
            name={`${fieldName}.${item.key}` as FieldPath<ProcessingProcessFormValues>}
            control={control}
            render={({ field }) => (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                  px: 2,
                  py: 1,
                }}
              >
                <Typography>{item.label}</Typography>
                <FormControlLabel
                  label={field.value ? "Да" : "Нет"}
                  labelPlacement="start"
                  control={
                    <Switch
                      checked={Boolean(field.value)}
                      onChange={(_, checked) => field.onChange(checked)}
                      slotProps={{ input: { "aria-label": item.label } }}
                    />
                  }
                  sx={{ m: 0, minWidth: 88, justifyContent: "space-between" }}
                />
              </Box>
            )}
          />
        ))}
      </Stack>
    </Stack>
  );
}
