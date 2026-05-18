import { Checkbox, FormControl, FormControlLabel, FormHelperText, FormGroup } from "@mui/material";

export type TwoColumnCheckboxItem<TValue extends string = string> = {
  value: TValue;
  label: string;
  disabled?: boolean;
};

type TwoColumnCheckboxGroupProps<TValue extends string = string> = {
  items: readonly TwoColumnCheckboxItem<TValue>[];
  isChecked: (value: TValue) => boolean;
  onToggle: (value: TValue, checked: boolean) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  minItemsForColumns?: number;
};

export function TwoColumnCheckboxGroup<TValue extends string = string>({
  items,
  isChecked,
  onToggle,
  disabled = false,
  error = false,
  helperText,
  minItemsForColumns = 4,
}: TwoColumnCheckboxGroupProps<TValue>) {
  const useColumns = items.length >= minItemsForColumns;

  return (
    <FormControl component="fieldset" fullWidth error={error}>
      <FormGroup
        sx={{
          display: "grid",
          gridTemplateColumns: useColumns ? { xs: "1fr", md: "1fr 1fr" } : "1fr",
          columnGap: 2,
          rowGap: 0.5,
        }}
      >
        {items.map((item) => (
          <FormControlLabel
            key={item.value}
            control={
              <Checkbox
                checked={isChecked(item.value)}
                disabled={disabled || item.disabled}
                onChange={(event) => onToggle(item.value, event.target.checked)}
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
        ))}
      </FormGroup>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
}
