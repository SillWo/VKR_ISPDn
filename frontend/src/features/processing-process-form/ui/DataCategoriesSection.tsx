import {
  Alert,
  Box,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, type Control, type FieldErrors, type FieldPath } from "react-hook-form";

import { dataCategoryGroups } from "../../../entities/processing-process/model/catalogs";
import type { ProcessingProcessFormValues } from "../../../entities/processing-process/model/types";

type DataCategoriesSectionProps = {
  control: Control<ProcessingProcessFormValues>;
  errors: FieldErrors<ProcessingProcessFormValues>;
  groupTitles?: string[];
};

export function DataCategoriesSection({ control, errors, groupTitles }: DataCategoriesSectionProps) {
  const errorMessage = errors.dataCategories?.message;
  const groups = groupTitles
    ? dataCategoryGroups.filter((group) => groupTitles.includes(group.title))
    : dataCategoryGroups;

  return (
    <Stack spacing={3}>
      {errorMessage && <Alert severity="error">{String(errorMessage)}</Alert>}
      {groups.map((group) => (
        <Stack key={group.title} spacing={1.5}>
          <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 600 }}>
            {group.title}
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              columnGap: 2,
              rowGap: 0.5,
            }}
          >
            {group.items.map((item) => (
                <Controller
                  key={item.key}
                  name={`dataCategories.${item.key}` as FieldPath<ProcessingProcessFormValues>}
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
          </Box>
          {group.textItems?.map((item) => (
            <Controller
              key={item.key}
              name={`dataCategories.${item.key}` as FieldPath<ProcessingProcessFormValues>}
              control={control}
              render={({ field }) => (
                <TextField
                  label={item.label}
                  fullWidth
                  multiline
                  minRows={2}
                  value={typeof field.value === "string" ? field.value : ""}
                  onChange={field.onChange}
                  helperText="Заполните, если нужной категории нет в перечне выше."
                />
              )}
            />
          ))}
        </Stack>
      ))}
    </Stack>
  );
}
