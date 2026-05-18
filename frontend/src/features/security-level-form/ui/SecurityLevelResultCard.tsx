import { Alert, Chip, Paper, Stack, Typography } from "@mui/material";

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

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "#f6f6f8" }}>
      <Stack spacing={1.5}>
        <Typography sx={{ fontWeight: 600 }}>Рекомендуемый уровень защищённости</Typography>
        <Chip label={`${result.recommendedLevel} уровень`} color="info" sx={{ alignSelf: "flex-start" }} />
      </Stack>
    </Paper>
  );
}
