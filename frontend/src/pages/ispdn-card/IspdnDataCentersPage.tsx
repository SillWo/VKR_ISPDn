import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";

import {
  getIspdnDataCenters,
  updateIspdnDataCenters,
} from "../../entities/data-center/api/dataCenterApi";
import type { DataCenterOption } from "../../entities/data-center/model/types";
import { DataCenterSelect } from "../../features/data-center-select/DataCenterSelect";

export function IspdnDataCentersPage() {
  const { ispdnId } = useParams();
  const numericId = Number(ispdnId);
  const isValidId = Number.isInteger(numericId) && numericId > 0;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const queryClient = useQueryClient();

  const dataCentersQuery = useQuery({
    queryKey: ["ispdnDataCenters", numericId],
    queryFn: () => getIspdnDataCenters(numericId),
    enabled: isValidId,
    retry: false,
  });

  useEffect(() => {
    if (dialogOpen) {
      setSelectedIds(dataCentersQuery.data?.map((dataCenter) => dataCenter.id) ?? []);
    }
  }, [dataCentersQuery.data, dialogOpen]);

  const updateMutation = useMutation({
    mutationFn: (dataCenterIds: number[]) => updateIspdnDataCenters(numericId, dataCenterIds),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["ispdnDataCenters", numericId] });
      await queryClient.invalidateQueries({ queryKey: ["ispdn", numericId] });
      setDialogOpen(false);
    },
  });

  if (!isValidId) {
    return <Alert severity="error">Некорректный идентификатор ИСПДн в маршруте.</Alert>;
  }

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
        <Box>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 600 }}>
            Связанные ЦОД
          </Typography>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignSelf: { sm: "flex-start" } }}>
          <Button
            variant="outlined"
            component={RouterLink}
            to="/data-centers"
          >
            Перейти в реестр ЦОД
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => setDialogOpen(true)}
            disabled={dataCentersQuery.isLoading}
          >
            Изменить список ЦОД
          </Button>
        </Stack>
      </Stack>

      {dataCentersQuery.isError && <Alert severity="error">Не удалось загрузить связанные ЦОД.</Alert>}
      {updateMutation.isError && <Alert severity="error">Не удалось сохранить список связанных ЦОД.</Alert>}

      <Paper variant="outlined" sx={{ borderRadius: 2, bgcolor: "background.paper" }}>
        <Box sx={{ p: 2 }}>
          <LinkedDataCentersTable
            dataCenters={dataCentersQuery.data ?? []}
            isLoading={dataCentersQuery.isLoading}
          />
        </Box>
      </Paper>

      <Button
        component={RouterLink}
        to={`/ispdns/${numericId}`}
        startIcon={<ArrowBackIcon />}
        sx={{ alignSelf: "flex-start" }}
      >
        Вернуться к карточке ИСПДн
      </Button>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Изменить список ЦОД</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <DataCenterSelect
              value={selectedIds}
              onChange={setSelectedIds}
              disabled={updateMutation.isPending}
              label="Связанные ЦОД"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setDialogOpen(false)} disabled={updateMutation.isPending}>
            Отмена
          </Button>
          <Button variant="contained" onClick={() => updateMutation.mutate(selectedIds)} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Сохранение..." : "Сохранить"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

function LinkedDataCentersTable({
  dataCenters,
  isLoading,
}: {
  dataCenters: DataCenterOption[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return <Alert severity="info">Загрузка связанных ЦОД...</Alert>;
  }

  if (dataCenters.length === 0) {
    return <Alert severity="info">Для этой ИСПДн ЦОД не выбраны</Alert>;
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Название</TableCell>
            <TableCell>Страна расположения</TableCell>
            <TableCell>Адрес местонахождения</TableCell>
            <TableCell>Собственный ЦОД</TableCell>
            <TableCell>Владелец / ответственная организация</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {dataCenters.map((dataCenter) => (
            <TableRow key={dataCenter.id} hover>
              <TableCell sx={{ fontWeight: 600 }}>{dataCenter.name}</TableCell>
              <TableCell>{dataCenter.locationCountry}</TableCell>
              <TableCell>{dataCenter.locationAddress}</TableCell>
              <TableCell>{dataCenter.isOwnDataCenter ? "Да" : "Нет"}</TableCell>
              <TableCell>{dataCenter.ownerDisplayName}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
