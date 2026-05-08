import { Alert, Chip, Paper, Stack, Typography } from "@mui/material";

import { dataCategoryOptions, threatTypeLabels } from "../../../entities/security-level/model/catalogs";
import type { SecurityLevelCalculationResult } from "../../../entities/security-level/model/types";

type SecurityLevelResultCardProps = {
  result: SecurityLevelCalculationResult | null;
  isCalculating?: boolean;
  error?: boolean;
};

export function SecurityLevelResultCard({ result, isCalculating, error }: SecurityLevelResultCardProps) {
  if (error) {
    return <Alert severity="error">Не удалось выполнить предварительный расчёт. Проверьте входные данные.</Alert>;
  }

  if (isCalculating) {
    return <Alert severity="info">Выполняется предварительный расчёт уровня защищённости.</Alert>;
  }

  if (!result) {
    return <Alert severity="info">Заполните входные параметры, чтобы получить рекомендуемый уровень.</Alert>;
  }

  const primaryCategory =
    dataCategoryOptions.find((option) => option.value === result.primaryDataCategory)?.label ?? result.primaryDataCategory;

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "#f6f6f8" }}>
      <Stack spacing={1.5}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "space-between" }}>
          <Typography sx={{ fontWeight: 600 }}>Рекомендуемый уровень защищённости</Typography>
          <Chip label={`${result.recommendedLevel} уровень`} color="info" />
        </Stack>
        <Typography variant="body2" color="text.secondary">
          Основная категория: {primaryCategory}. Тип актуальных угроз: {threatTypeLabels[result.threatType]}. Только
          сотрудники: {result.employeeOnly ? "да" : "нет"}.
        </Typography>
      </Stack>
    </Paper>
  );
}
