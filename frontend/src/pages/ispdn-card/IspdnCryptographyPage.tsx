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
  FormControlLabel,
  Paper,
  Stack,
  Switch,
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
  getIspdnCryptography,
  updateIspdnCryptography,
} from "../../entities/crypto-tool/api/cryptoToolApi";
import type { CryptoToolOption } from "../../entities/crypto-tool/model/types";
import { cryptoToolClassLabels } from "../../features/crypto-tool-form/model/schema";
import { CryptoToolSelect } from "../../features/crypto-tool-select/CryptoToolSelect";

export function IspdnCryptographyPage() {
  const { ispdnId } = useParams();
  const numericId = Number(ispdnId);
  const isValidId = Number.isInteger(numericId) && numericId > 0;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [usesCryptography, setUsesCryptography] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [validationError, setValidationError] = useState(false);
  const queryClient = useQueryClient();

  const cryptographyQuery = useQuery({
    queryKey: ["ispdnCryptography", numericId],
    queryFn: () => getIspdnCryptography(numericId),
    enabled: isValidId,
    retry: false,
  });

  useEffect(() => {
    if (dialogOpen) {
      setUsesCryptography(cryptographyQuery.data?.usesCryptography ?? false);
      setSelectedIds(cryptographyQuery.data?.cryptoTools.map((cryptoTool) => cryptoTool.id) ?? []);
      setValidationError(false);
    }
  }, [cryptographyQuery.data, dialogOpen]);

  const updateMutation = useMutation({
    mutationFn: () =>
      updateIspdnCryptography(numericId, {
        usesCryptography,
        cryptoToolIds: usesCryptography ? selectedIds : [],
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["ispdnCryptography", numericId] });
      await queryClient.invalidateQueries({ queryKey: ["ispdn", numericId] });
      setDialogOpen(false);
    },
  });

  const handleSave = () => {
    if (usesCryptography && selectedIds.length === 0) {
      setValidationError(true);
      return;
    }
    setValidationError(false);
    updateMutation.mutate();
  };

  if (!isValidId) {
    return <Alert severity="error">Некорректный идентификатор ИСПДн в маршруте.</Alert>;
  }

  const data = cryptographyQuery.data;

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
        <Box>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 600 }}>
            Криптография
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 820 }}>
            Признак использования СКЗИ и список средств криптографической защиты, связанных с выбранной ИСПДн.
          </Typography>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignSelf: { sm: "flex-start" } }}>
          <Button variant="outlined" component={RouterLink} to="/cryptography">
            Перейти в реестр СКЗИ
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => setDialogOpen(true)}
            disabled={cryptographyQuery.isLoading}
          >
            Изменить
          </Button>
        </Stack>
      </Stack>

      {cryptographyQuery.isError && <Alert severity="error">Не удалось загрузить криптографию ИСПДн.</Alert>}
      {updateMutation.isError && <Alert severity="error">Не удалось сохранить криптографию ИСПДн.</Alert>}

      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, bgcolor: "background.paper" }}>
        <Stack spacing={2}>
          <Box>
            <Typography component="h2" variant="h6" sx={{ fontWeight: 600 }}>
              Использование СКЗИ
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              {data?.usesCryptography ? "СКЗИ используются в этой ИСПДн." : "В этой ИСПДн СКЗИ не используются"}
            </Typography>
          </Box>
          {data?.usesCryptography && <LinkedCryptoToolsTable cryptoTools={data.cryptoTools} />}
        </Stack>
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
        <DialogTitle>Изменить криптографию ИСПДн</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={usesCryptography}
                  onChange={(_, checked) => {
                    setUsesCryptography(checked);
                    if (!checked) {
                      setSelectedIds([]);
                      setValidationError(false);
                    }
                  }}
                  disabled={updateMutation.isPending}
                />
              }
              label="Используется СКЗИ"
            />
            {usesCryptography && (
              <CryptoToolSelect
                value={selectedIds}
                onChange={(ids) => {
                  setSelectedIds(ids);
                  setValidationError(false);
                }}
                disabled={updateMutation.isPending}
                label="Связанные СКЗИ"
              />
            )}
            {validationError && <Alert severity="error">Выберите минимум одно СКЗИ.</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setDialogOpen(false)} disabled={updateMutation.isPending}>
            Отмена
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Сохранение..." : "Сохранить"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

function LinkedCryptoToolsTable({ cryptoTools }: { cryptoTools: CryptoToolOption[] }) {
  if (cryptoTools.length === 0) {
    return <Alert severity="warning">СКЗИ не выбраны.</Alert>;
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Наименование</TableCell>
            <TableCell>Класс</TableCell>
            <TableCell>Изготовитель</TableCell>
            <TableCell>Серийный номер</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {cryptoTools.map((cryptoTool) => (
            <TableRow key={cryptoTool.id} hover>
              <TableCell sx={{ fontWeight: 600 }}>{cryptoTool.name}</TableCell>
              <TableCell>{cryptoToolClassLabels[cryptoTool.cryptoClass]}</TableCell>
              <TableCell>{cryptoTool.manufacturer}</TableCell>
              <TableCell>{cryptoTool.serialNumber}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
