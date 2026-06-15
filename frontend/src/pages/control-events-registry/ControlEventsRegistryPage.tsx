import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import UploadFileIcon from "@mui/icons-material/UploadFile";
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
import { ChangeEvent, useState } from "react";

import {
  createControlEvent,
  deleteControlEvent,
  deleteControlEventFile,
  downloadControlEventFile,
  getControlEvents,
  updateControlEvent,
  uploadControlEventFile,
} from "../../entities/control-event/api/controlEventApi";
import type {
  ControlEvent,
  ControlEventFile,
  ControlEventFormValues,
} from "../../entities/control-event/model/types";
import { defaultControlEventFormValues } from "../../features/control-event-form/model/schema";
import { ControlEventForm } from "../../features/control-event-form/ui/ControlEventForm";

const CONTROL_EVENT_FILE_ACCEPT =
  ".pdf,.docx,.xlsx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export function ControlEventsRegistryPage() {
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; controlEvent?: ControlEvent } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState(false);
  const queryClient = useQueryClient();

  const controlEventsQuery = useQuery({ queryKey: ["controlEvents"], queryFn: getControlEvents });

  const createMutation = useMutation({
    mutationFn: createControlEvent,
    onSuccess: async () => {
      await invalidateControlEvents(queryClient);
      setDialog(null);
      setSuccessMessage("Контрольное мероприятие создано.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: ControlEventFormValues }) =>
      updateControlEvent(id, values),
    onSuccess: async (controlEvent) => {
      await invalidateControlEvents(queryClient);
      setDialog({ mode: "edit", controlEvent });
      setSuccessMessage("Контрольное мероприятие обновлено.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteControlEvent,
    onSuccess: async () => {
      await invalidateControlEvents(queryClient);
      setDialog(null);
      setSuccessMessage("Контрольное мероприятие удалено.");
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: ({ controlEventId, file }: { controlEventId: number; file: File }) =>
      uploadControlEventFile(controlEventId, file),
    onSuccess: async () => {
      await invalidateControlEvents(queryClient);
      setSuccessMessage("Файл загружен.");
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: ({ controlEventId, fileId }: { controlEventId: number; fileId: number }) =>
      deleteControlEventFile(controlEventId, fileId),
    onSuccess: async () => {
      await invalidateControlEvents(queryClient);
      setSuccessMessage("Файл удалён.");
    },
  });

  const selectedControlEvent =
    dialog?.controlEvent && controlEventsQuery.data
      ? controlEventsQuery.data.find((item) => item.id === dialog.controlEvent?.id) ?? dialog.controlEvent
      : dialog?.controlEvent;

  const formValues = selectedControlEvent
    ? {
        name: selectedControlEvent.name,
        description: selectedControlEvent.description,
      }
    : defaultControlEventFormValues;

  const handleSubmit = (values: ControlEventFormValues) => {
    if (dialog?.mode === "edit" && selectedControlEvent) {
      updateMutation.mutate({ id: selectedControlEvent.id, values });
      return;
    }
    createMutation.mutate(values);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
        <Box>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 600 }}>
            Реестр контрольных мероприятий
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialog({ mode: "create" })}
          sx={{ alignSelf: { sm: "flex-start" } }}
        >
          Добавить контрольное мероприятие
        </Button>
      </Stack>

      {controlEventsQuery.isError && (
        <Alert severity="error">
          Не удалось загрузить контрольные мероприятия. Проверьте доступность backend API.
        </Alert>
      )}
      {(createMutation.isError || updateMutation.isError) && (
        <Alert severity="error">
          Не удалось сохранить контрольное мероприятие. Проверьте данные и уникальность названия.
        </Alert>
      )}
      {deleteMutation.isError && <Alert severity="error">Не удалось удалить контрольное мероприятие.</Alert>}
      {uploadFileMutation.isError && (
        <Alert severity="error">Не удалось загрузить файл. Разрешены только .pdf, .docx и .xlsx.</Alert>
      )}
      {(deleteFileMutation.isError || downloadError) && (
        <Alert severity="error">
          {deleteFileMutation.isError ? "Не удалось удалить файл." : "Не удалось скачать файл."}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ borderRadius: 2, bgcolor: "background.paper" }}>
        <Box sx={{ p: 2 }}>
          <ControlEventsTable
            controlEvents={controlEventsQuery.data ?? []}
            isLoading={controlEventsQuery.isLoading}
            onEdit={(controlEvent) => setDialog({ mode: "edit", controlEvent })}
            onDelete={(controlEvent) => {
              if (window.confirm(`Удалить контрольное мероприятие "${controlEvent.name}"?`)) {
                deleteMutation.mutate(controlEvent.id);
              }
            }}
          />
        </Box>
      </Paper>

      <Dialog open={dialog !== null} onClose={() => setDialog(null)} fullWidth maxWidth="md">
        <DialogTitle>
          {dialog?.mode === "edit" ? "Редактировать контрольное мероприятие" : "Добавить контрольное мероприятие"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <ControlEventForm
              key={selectedControlEvent?.id ?? "new-control-event"}
              defaultValues={formValues}
              submitLabel={dialog?.mode === "edit" ? "Сохранить изменения" : "Создать мероприятие"}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              onCancel={() => setDialog(null)}
            />
            {dialog?.mode === "edit" && selectedControlEvent && (
              <ControlEventFilesSection
                controlEvent={selectedControlEvent}
                isUploading={uploadFileMutation.isPending}
                isDeleting={deleteFileMutation.isPending}
                onUpload={(file) => uploadFileMutation.mutate({ controlEventId: selectedControlEvent.id, file })}
                onDownload={async (file) => {
                  setDownloadError(false);
                  try {
                    const blob = await downloadControlEventFile(selectedControlEvent.id, file.id);
                    downloadBlob(blob, file.fileName);
                  } catch {
                    setDownloadError(true);
                  }
                }}
                onDelete={(fileId) => deleteFileMutation.mutate({ controlEventId: selectedControlEvent.id, fileId })}
              />
            )}
          </Stack>
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

function ControlEventsTable({
  controlEvents,
  isLoading,
  onEdit,
  onDelete,
}: {
  controlEvents: ControlEvent[];
  isLoading: boolean;
  onEdit: (controlEvent: ControlEvent) => void;
  onDelete: (controlEvent: ControlEvent) => void;
}) {
  if (isLoading) {
    return <Alert severity="info">Загрузка контрольных мероприятий...</Alert>;
  }

  if (controlEvents.length === 0) {
    return <Alert severity="info">В реестре пока нет контрольных мероприятий.</Alert>;
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Название</TableCell>
            <TableCell>Описание</TableCell>
            <TableCell sx={{ width: 120 }}>Файлы</TableCell>
            <TableCell sx={{ width: 180 }}>Последнее обновление</TableCell>
            <TableCell align="right" sx={{ width: 120 }}>
              Действия
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {controlEvents.map((controlEvent) => (
            <TableRow key={controlEvent.id} hover>
              <TableCell sx={{ fontWeight: 600 }}>{controlEvent.name}</TableCell>
              <TableCell>{controlEvent.description}</TableCell>
              <TableCell>{controlEvent.files.length}</TableCell>
              <TableCell>{formatDate(controlEvent.updatedAt)}</TableCell>
              <TableCell align="right">
                <Tooltip title="Редактировать">
                  <IconButton aria-label="Редактировать" onClick={() => onEdit(controlEvent)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Удалить">
                  <IconButton aria-label="Удалить" color="error" onClick={() => onDelete(controlEvent)}>
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

function ControlEventFilesSection({
  controlEvent,
  isUploading,
  isDeleting,
  onUpload,
  onDownload,
  onDelete,
}: {
  controlEvent: ControlEvent;
  isUploading: boolean;
  isDeleting: boolean;
  onUpload: (file: File) => void;
  onDownload: (file: ControlEventFile) => Promise<void>;
  onDelete: (fileId: number) => void;
}) {
  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) {
      onUpload(file);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}
        >
          <Box>
            <Typography sx={{ fontWeight: 700 }}>Связанные файлы</Typography>
            <Typography variant="body2" color="text.secondary">
              Файлы контрольного мероприятия хранятся в реестре и доступны для скачивания.
            </Typography>
          </Box>
          <Button component="label" variant="contained" startIcon={<UploadFileIcon />} disabled={isUploading}>
            Загрузить файл
            <input type="file" accept={CONTROL_EVENT_FILE_ACCEPT} hidden onChange={handleUpload} />
          </Button>
        </Stack>

        {controlEvent.files.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            Связанные файлы не загружены.
          </Typography>
        )}

        {controlEvent.files.length > 0 && (
          <Stack spacing={1}>
            {controlEvent.files.map((file) => (
              <Paper key={file.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600, overflowWrap: "anywhere" }}>{file.fileName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatFileSize(file.fileSizeBytes)} · {formatDate(file.createdAt)}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5} sx={{ flex: "0 0 auto" }}>
                    <Tooltip title="Скачать">
                      <IconButton size="small" onClick={() => void onDownload(file)}>
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Удалить">
                      <span>
                        <IconButton size="small" color="error" disabled={isDeleting} onClick={() => onDelete(file.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}

async function invalidateControlEvents(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: ["controlEvents"] });
  await queryClient.invalidateQueries({ queryKey: ["controlEventOptions"] });
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} Б`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} КБ`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
