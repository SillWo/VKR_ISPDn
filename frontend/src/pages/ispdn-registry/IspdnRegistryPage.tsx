import SearchIcon from "@mui/icons-material/Search";
import { Button, Stack, TextField, Typography } from "@mui/material";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { PlaceholderPage } from "../../shared/ui/PlaceholderPage";

const filterSchema = z.object({
  query: z.string().max(120),
});

type FilterValues = z.infer<typeof filterSchema>;

export function IspdnRegistryPage() {
  const { register, handleSubmit } = useForm<FilterValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: { query: "" },
  });

  return (
    <PlaceholderPage
      title="Реестр ИСПДн"
      description="Стартовая страница будущего реестра информационных систем персональных данных."
    >
      <Stack component="form" spacing={2} onSubmit={handleSubmit(() => undefined)}>
        <Typography color="text.secondary">
          Здесь позже появится список ИСПДн и переход в карточку выбранной системы.
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <TextField
            label="Поиск"
            size="small"
            fullWidth
            disabled
            {...register("query")}
            helperText="Поле добавлено как заготовка клиентской валидации, без бизнес-логики."
          />
          <Button type="submit" variant="contained" startIcon={<SearchIcon />} disabled>
            Найти
          </Button>
        </Stack>
      </Stack>
    </PlaceholderPage>
  );
}
