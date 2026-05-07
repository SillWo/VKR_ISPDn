import AddIcon from "@mui/icons-material/Add";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";

import { getIspdns } from "../../entities/ispdn/api/ispdnApi";
import type { IspdnStatus } from "../../entities/ispdn/model/types";

const statusLabels: Record<IspdnStatus, string> = {
  active: "Работает",
  archived: "Архив",
};

const statusColors: Record<IspdnStatus, "success" | "default"> = {
  active: "success",
  archived: "default",
};

function formatDate(value: string | null) {
  if (!value) {
    return "Не указана";
  }
  return new Intl.DateTimeFormat("ru-RU").format(new Date(value));
}

export function IspdnRegistryPage() {
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["ispdns"],
    queryFn: getIspdns,
  });

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
        <Box>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 600 }}>
            Реестр ИСПДн
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 760 }}>
            Карточки информационных систем персональных данных организации, их статус и ответственные за обработку ПДн.
          </Typography>
        </Box>
        <Button component={RouterLink} to="/ispdns/new" variant="contained" startIcon={<AddIcon />} sx={{ alignSelf: { sm: "flex-start" } }}>
          Создать ИСПДн
        </Button>
      </Stack>

      {isLoading && (
        <Paper variant="outlined" sx={{ p: 4, borderRadius: 2, textAlign: "center" }}>
          <CircularProgress size={28} />
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            Загрузка реестра ИСПДн
          </Typography>
        </Paper>
      )}

      {isError && <Alert severity="error">Не удалось загрузить реестр ИСПДн. Проверьте доступность backend API.</Alert>}

      {!isLoading && !isError && data.length === 0 && (
        <Paper variant="outlined" sx={{ p: 4, borderRadius: 2 }}>
          <Stack spacing={1.5} sx={{ alignItems: "flex-start" }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              В реестре пока нет карточек ИСПДн
            </Typography>
            <Typography color="text.secondary">
              Создайте первую карточку, чтобы зафиксировать базовые сведения об ИСПДн и открыть связанные разделы.
            </Typography>
            <Button component={RouterLink} to="/ispdns/new" variant="contained" startIcon={<AddIcon />}>
              Создать ИСПДн
            </Button>
          </Stack>
        </Paper>
      )}

      {!isLoading && !isError && data.length > 0 && (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Название</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell>Ответственный</TableCell>
                <TableCell>Цели обработки ПДн</TableCell>
                <TableCell>Дата ввода</TableCell>
                <TableCell>Дата вывода</TableCell>
                <TableCell>Последнее обновление</TableCell>
                <TableCell align="right">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography sx={{ fontWeight: 600 }}>{item.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.shortDescription}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip label={statusLabels[item.status]} color={statusColors[item.status]} size="small" />
                  </TableCell>
                  <TableCell>{item.responsibleEmployee?.fullName ?? item.responsiblePerson}</TableCell>
                  <TableCell sx={{ maxWidth: 280 }}>{item.processingPurposes}</TableCell>
                  <TableCell>{formatDate(item.commissioningDate)}</TableCell>
                  <TableCell>{formatDate(item.decommissioningDate)}</TableCell>
                  <TableCell>{formatDate(item.updatedAt)}</TableCell>
                  <TableCell align="right">
                    <Button
                      component={RouterLink}
                      to={`/ispdns/${item.id}`}
                      variant="outlined"
                      size="small"
                      startIcon={<OpenInNewIcon />}
                    >
                      Открыть
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  );
}
