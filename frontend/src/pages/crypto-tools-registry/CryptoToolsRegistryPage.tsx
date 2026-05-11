import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import {
  createCryptoTool,
  deleteCryptoTool,
  getCryptoToolById,
  getCryptoTools,
  toCryptoToolFormValues,
  updateCryptoTool,
} from "../../entities/crypto-tool/api/cryptoToolApi";
import type { CryptoToolFormValues, CryptoToolListItem } from "../../entities/crypto-tool/model/types";
import { cryptoToolClassLabels, defaultCryptoToolFormValues } from "../../features/crypto-tool-form/model/schema";
import { CryptoToolForm } from "../../features/crypto-tool-form/ui/CryptoToolForm";
import { HttpError } from "../../shared/api/httpClient";

type DialogState = { mode: "create" } | { mode: "edit"; cryptoToolId: number };

export function CryptoToolsRegistryPage() {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const cryptoToolsQuery = useQuery({ queryKey: ["cryptoTools"], queryFn: getCryptoTools });
  const editQuery = useQuery({
    queryKey: ["cryptoTool", dialog?.mode === "edit" ? dialog.cryptoToolId : null],
    queryFn: () => getCryptoToolById(dialog?.mode === "edit" ? dialog.cryptoToolId : 0),
    enabled: dialog?.mode === "edit",
  });

  const createMutation = useMutation({
    mutationFn: createCryptoTool,
    onSuccess: async () => {
      await invalidateCryptoTools(queryClient);
      setDialog(null);
      setSuccessMessage("СКЗИ создано.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: CryptoToolFormValues }) => updateCryptoTool(id, values),
    onSuccess: async () => {
      await invalidateCryptoTools(queryClient);
      setDialog(null);
      setSuccessMessage("СКЗИ обновлено.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCryptoTool,
    onSuccess: async () => {
      await invalidateCryptoTools(queryClient);
      setSuccessMessage("СКЗИ удалено.");
    },
  });

  const formValues =
    dialog?.mode === "edit" && editQuery.data ? toCryptoToolFormValues(editQuery.data) : defaultCryptoToolFormValues;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const deleteConflict = deleteMutation.error instanceof HttpError && deleteMutation.error.status === 409;

  const handleSubmit = (values: CryptoToolFormValues) => {
    if (dialog?.mode === "edit") {
      updateMutation.mutate({ id: dialog.cryptoToolId, values });
      return;
    }
    createMutation.mutate(values);
  };

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
        <Box>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 600 }}>
            Криптография
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 820 }}>
            Глобальный реестр средств криптографической защиты информации, которые можно связать с одной или несколькими ИСПДн.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialog({ mode: "create" })}
          sx={{ alignSelf: { sm: "flex-start" } }}
        >
          Создать СКЗИ
        </Button>
      </Stack>

      {cryptoToolsQuery.isError && <Alert severity="error">Не удалось загрузить реестр СКЗИ.</Alert>}
      {(createMutation.isError || updateMutation.isError) && (
        <Alert severity="error">Не удалось сохранить СКЗИ. Проверьте обязательные поля.</Alert>
      )}
      {deleteMutation.isError && (
        <Alert severity="error">
          {deleteConflict
            ? "Нельзя удалить СКЗИ, потому что оно используется в одной или нескольких ИСПДн."
            : "Не удалось удалить СКЗИ."}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ borderRadius: 2, bgcolor: "background.paper" }}>
        <Box sx={{ p: 2 }}>
          <CryptoToolsTable
            cryptoTools={cryptoToolsQuery.data ?? []}
            isLoading={cryptoToolsQuery.isLoading}
            onEdit={(cryptoTool) => setDialog({ mode: "edit", cryptoToolId: cryptoTool.id })}
            onDelete={(cryptoTool) => {
              if (window.confirm(`Вы точно хотите удалить СКЗИ «${cryptoTool.name}»?`)) {
                deleteMutation.mutate(cryptoTool.id);
              }
            }}
          />
        </Box>
      </Paper>

      <Dialog open={dialog !== null} onClose={() => setDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle>{dialog?.mode === "edit" ? "Редактировать СКЗИ" : "Создать СКЗИ"}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {dialog?.mode === "edit" && editQuery.isLoading && <Alert severity="info">Загрузка СКЗИ...</Alert>}
            {dialog?.mode === "edit" && editQuery.isError && (
              <Alert severity="error">Не удалось загрузить СКЗИ для редактирования.</Alert>
            )}
            {(dialog?.mode === "create" || editQuery.data) && (
              <CryptoToolForm
                key={dialog?.mode === "edit" ? dialog.cryptoToolId : "new-crypto-tool"}
                defaultValues={formValues}
                submitLabel={dialog?.mode === "edit" ? "Сохранить изменения" : "Создать СКЗИ"}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
                onCancel={() => setDialog(null)}
              />
            )}
          </Box>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
      />
    </Stack>
  );
}

function CryptoToolsTable({
  cryptoTools,
  isLoading,
  onEdit,
  onDelete,
}: {
  cryptoTools: CryptoToolListItem[];
  isLoading: boolean;
  onEdit: (cryptoTool: CryptoToolListItem) => void;
  onDelete: (cryptoTool: CryptoToolListItem) => void;
}) {
  if (isLoading) {
    return <Alert severity="info">Загрузка СКЗИ...</Alert>;
  }

  if (cryptoTools.length === 0) {
    return <Alert severity="info">СКЗИ пока не добавлены</Alert>;
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
            <TableCell align="right">Действия</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {cryptoTools.map((cryptoTool) => (
            <TableRow key={cryptoTool.id} hover>
              <TableCell sx={{ fontWeight: 600 }}>{cryptoTool.name}</TableCell>
              <TableCell>{cryptoToolClassLabels[cryptoTool.cryptoClass]}</TableCell>
              <TableCell>{cryptoTool.manufacturer}</TableCell>
              <TableCell>{cryptoTool.serialNumber}</TableCell>
              <TableCell align="right">
                <Tooltip title="Редактировать">
                  <IconButton aria-label="Редактировать" onClick={() => onEdit(cryptoTool)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Удалить">
                  <IconButton aria-label="Удалить" color="error" onClick={() => onDelete(cryptoTool)}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

async function invalidateCryptoTools(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: ["cryptoTools"] });
  await queryClient.invalidateQueries({ queryKey: ["cryptoToolOptions"] });
}
