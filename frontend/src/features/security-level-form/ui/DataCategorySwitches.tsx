import { Checkbox, FormControl, FormControlLabel, FormGroup, FormHelperText } from "@mui/material";
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
      <FormGroup
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          columnGap: 2,
          rowGap: 0.5,
        }}
      >
        {dataCategoryOptions.map((category) => (
          <Controller
            key={category.value}
            name={`dataCategories.${category.value}`}
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={field.value}
                    disabled={disabled}
                    onChange={(event) => field.onChange(event.target.checked)}
                  />
                }
                label={category.label}
                sx={{
                  m: 0,
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  "& .MuiCheckbox-root": { py: 0.25 },
                }}
              />
            )}
          />
        ))}
      </FormGroup>
      {errors.dataCategories?.message && <FormHelperText>{errors.dataCategories.message}</FormHelperText>}
    </FormControl>
  );
}
