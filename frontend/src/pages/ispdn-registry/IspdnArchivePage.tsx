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

export function IspdnArchivePage() {
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["ispdns", "archived"],
    queryFn: () => getIspdns({ status: "archived" }),
  });

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
        <Box>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 600 }}>
            Архив ИСПДн
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 760 }}>
            Карточки ИСПДн со статусом «Архив».
          </Typography>
        </Box>
        <Button component={RouterLink} to="/ispdns" variant="outlined" sx={{ alignSelf: { sm: "flex-start" } }}>
          К реестру ИСПДн
        </Button>
      </Stack>

      {isLoading && (
        <Paper variant="outlined" sx={{ p: 4, borderRadius: 2, textAlign: "center" }}>
          <CircularProgress size={28} />
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            Загрузка архива ИСПДн
          </Typography>
        </Paper>
      )}

      {isError && <Alert severity="error">Не удалось загрузить архив ИСПДн. Проверьте доступность backend API.</Alert>}

      {!isLoading && !isError && data.length === 0 && (
        <Paper variant="outlined" sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            В архиве пока нет карточек ИСПДн
          </Typography>
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
