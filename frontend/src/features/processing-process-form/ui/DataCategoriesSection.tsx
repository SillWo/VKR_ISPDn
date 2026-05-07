import {
  Alert,
  Box,
  Divider,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, type Control, type FieldErrors, type FieldPath } from "react-hook-form";

import { dataCategoryGroups } from "../../../entities/processing-process/model/catalogs";
import type { ProcessingProcessFormValues } from "../../../entities/processing-process/model/types";

type DataCategoriesSectionProps = {
  control: Control<ProcessingProcessFormValues>;
  errors: FieldErrors<ProcessingProcessFormValues>;
};

export function DataCategoriesSection({ control, errors }: DataCategoriesSectionProps) {
  const errorMessage = errors.dataCategories?.message;

  return (
    <Stack spacing={3}>
      {errorMessage && <Alert severity="error">{String(errorMessage)}</Alert>}
      {dataCategoryGroups.map((group) => (
        <Stack key={group.title} spacing={1.5}>
          <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 600 }}>
            {group.title}
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              bgcolor: "background.paper",
              overflow: "hidden",
            }}
          >
            {group.items.map((item, index) => (
              <Box key={item.key}>
                <Controller
                  name={`dataCategories.${item.key}` as FieldPath<ProcessingProcessFormValues>}
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
                        minHeight: 56,
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
                {index < group.items.length - 1 && <Divider />}
              </Box>
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
