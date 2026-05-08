import { Box, FormControl, FormHelperText, Stack, Switch, Typography } from "@mui/material";
import { Controller, type Control, type FieldErrors } from "react-hook-form";

import { dataCategoryOptions } from "../../../entities/security-level/model/catalogs";
import type { SecurityLevelFormValues } from "../../../entities/security-level/model/types";

type DataCategorySwitchesProps = {
  control: Control<SecurityLevelFormValues>;
  errors: FieldErrors<SecurityLevelFormValues>;
  disabled?: boolean;
};

export function DataCategorySwitches({ control, errors, disabled }: DataCategorySwitchesProps) {
  return (
    <FormControl error={Boolean(errors.dataCategories)} component="fieldset" fullWidth>
      <Stack spacing={1.5}>
        {dataCategoryOptions.map((category) => (
          <Controller
            key={category.value}
            name={`dataCategories.${category.value}`}
            control={control}
            render={({ field }) => (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  px: 2,
                  py: 1,
                  bgcolor: "background.paper",
                }}
              >
                <Typography>{category.label}</Typography>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <Typography variant="body2" color={!field.value ? "text.primary" : "text.secondary"}>
                    Нет
                  </Typography>
                  <Switch
                    checked={field.value}
                    disabled={disabled}
                    onChange={(event) => field.onChange(event.target.checked)}
                    slotProps={{ input: { "aria-label": category.label } }}
                  />
                  <Typography variant="body2" color={field.value ? "text.primary" : "text.secondary"}>
                    Да
                  </Typography>
                </Stack>
              </Box>
            )}
          />
        ))}
      </Stack>
      {errors.dataCategories?.message && <FormHelperText>{errors.dataCategories.message}</FormHelperText>}
    </FormControl>
  );
}
