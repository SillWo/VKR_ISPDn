import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChangeEvent, Fragment, memo, useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";

import {
  deleteTechnicalSecurityMeasureDocument,
  downloadTechnicalSecurityMeasureDocument,
  getTechnicalSecurityMeasureDocuments,
  getTechnicalSecurityMeasures,
  updateTechnicalSecurityMeasure,
  uploadTechnicalSecurityMeasureDocument,
} from "../../entities/security-measure/api/securityMeasureApi";
import type {
  TechnicalMeasureFactualStatus,
  TechnicalSecurityMeasure,
  TechnicalSecurityMeasureDocument,
  TechnicalSecurityMeasureUpdatePayload,
  TechnicalSecurityMeasuresTable,
} from "../../entities/security-measure/model/types";
import { HttpError } from "../../shared/api/httpClient";

export function IspdnSecurityMeasuresPage() {
  const { ispdnId } = useParams();
  const queryClient = useQueryClient();
  const numericId = Number(ispdnId);
  const isValidId = Number.isInteger(numericId) && numericId > 0;

  const measuresQuery = useQuery({
    queryKey: ["technicalSecurityMeasures", numericId],
    queryFn: () => getTechnicalSecurityMeasures(numericId),
    enabled: isValidId,
    retry: false,
  });

  const documentsQuery = useQuery({
    queryKey: ["technicalSecurityMeasureDocuments", numericId],
    queryFn: () => getTechnicalSecurityMeasureDocuments(numericId),
    enabled: isValidId,
    retry: false,
  });

  const updateMutation = useMutation({
    mutationFn: ({ measureCode, payload }: { measureCode: string; payload: TechnicalSecurityMeasureUpdatePayload }) =>
      updateTechnicalSecurityMeasure(numericId, measureCode, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["technicalSecurityMeasures", numericId] });
    },
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: (file: File) => uploadTechnicalSecurityMeasureDocument(numericId, file),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["technicalSecurityMeasureDocuments", numericId] });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (documentId: number) => deleteTechnicalSecurityMeasureDocument(numericId, documentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["technicalSecurityMeasureDocuments", numericId] });
    },
  });

  const groupedItems = useMemo(() => {
    const groups = new Map<string, TechnicalSecurityMeasure[]>();
    for (const item of measuresQuery.data?.items ?? []) {
      const key = `${item.sectionCode}. ${item.sectionTitle}`;
      groups.set(key, [...(groups.get(key) ?? []), item]);
    }
    return Array.from(groups.entries());
  }, [measuresQuery.data?.items]);

  if (!isValidId) {
    return <Alert severity="error">Некорректный идентификатор ИСПДн в маршруте.</Alert>;
  }

  const isSecurityLevelRequired = measuresQuery.error instanceof HttpError && measuresQuery.error.status === 409;

  return (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Button
          component={RouterLink}
          to={`/ispdns/${numericId}`}
          variant="text"
          startIcon={<ArrowBackIcon />}
          sx={{ alignSelf: "flex-start" }}
        >
          К карточке ИСПДн
        </Button>
        <Box>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 600 }}>
            Технические меры защиты
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 920 }}>
            Таблица мер по Приказу ФСТЭК №21 строится по фактическому уровню защищённости выбранной ИСПДн.
          </Typography>
        </Box>
      </Stack>

      {measuresQuery.isLoading && (
        <Paper variant="outlined" sx={{ p: 4, borderRadius: 2, textAlign: "center" }}>
          <CircularProgress size={28} />
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            Загрузка технических мер защиты
          </Typography>
        </Paper>
      )}

      {isSecurityLevelRequired && (
        <Alert
          severity="warning"
          action={
            <Button color="inherit" size="small" component={RouterLink} to={`/ispdns/${numericId}/security-level`}>
              Заполнить
            </Button>
          }
        >
          Сначала заполните модуль уровня защищённости.
        </Alert>
      )}

      {measuresQuery.isError && !isSecurityLevelRequired && (
        <Alert severity="error">Не удалось загрузить технические меры защиты. Проверьте доступность backend API.</Alert>
      )}

      {updateMutation.isError && (
        <Alert severity="error">Не удалось сохранить меру. Проверьте фактический статус и комментарий.</Alert>
      )}

      {uploadDocumentMutation.isError && (
        <Alert severity="error">Не удалось загрузить документ. Проверьте формат файла.</Alert>
      )}

      {measuresQuery.data && (
        <>
          <SecurityMeasuresDashboard table={measuresQuery.data} />
          <TechnicalSecurityMeasureDocumentsSection
            documents={documentsQuery.data ?? []}
            isLoading={documentsQuery.isLoading}
            isUploading={uploadDocumentMutation.isPending}
            isDeleting={deleteDocumentMutation.isPending}
            onUpload={(file) => uploadDocumentMutation.mutate(file)}
            onDownload={async (documentItem) => {
              const blob = await downloadTechnicalSecurityMeasureDocument(numericId, documentItem.id);
              downloadBlob(blob, documentItem.fileName);
            }}
            onDelete={(documentId) => deleteDocumentMutation.mutate(documentId)}
          />
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 120 }}>Код меры по приказу</TableCell>
                  <TableCell>Содержание меры по приказу</TableCell>
                  <TableCell sx={{ width: 170 }}>Статус по приказу</TableCell>
                  <TableCell sx={{ width: 220 }}>Фактический статус</TableCell>
                  <TableCell sx={{ width: 360 }}>Комментарий</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {groupedItems.map(([sectionTitle, items]) => (
                  <Fragment key={sectionTitle}>
                    <TableRow>
                      <TableCell colSpan={5} sx={{ bgcolor: "background.default", fontWeight: 700 }}>
                        {sectionTitle}
                      </TableCell>
                    </TableRow>
                    {items.map((item) => (
                      <TechnicalSecurityMeasureRow
                        key={item.code}
                        item={item}
                        onSave={(payload) => updateMutation.mutateAsync({ measureCode: item.code, payload })}
                      />
                    ))}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Stack>
  );
}

function SecurityMeasuresDashboard({ table }: { table: TechnicalSecurityMeasuresTable }) {
  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, minWidth: { md: 260 } }}>
        <Typography variant="body2" color="text.secondary">
          Уровень защищённости ИСПДн
        </Typography>
        <Typography sx={{ mt: 1, fontSize: 32, lineHeight: 1.2, fontWeight: 700 }}>
          {table.actualLevel} уровень
        </Typography>
      </Paper>
      <PieChartCard
        title="Меры базового набора"
        items={[
          { label: "Внедрено", value: table.summary.baseSetImplementedCount, color: "#44b48b" },
          { label: "Не внедрено", value: table.summary.baseSetNotImplementedCount, color: "#d14343" },
          { label: "Отвергнуты", value: table.summary.baseSetRejectedCount, color: "#b86b00" },
        ]}
      />
      <PieChartCard
        title="Комментарии по мерам"
        items={[
          { label: "Требуют комментария", value: table.summary.commentRequiredCount, color: "#ec652b" },
          { label: "Не требуют комментария", value: table.summary.commentNotRequiredCount, color: "#7ea7e9" },
        ]}
      />
    </Stack>
  );
}

function PieChartCard({
  title,
  items,
}: {
  title: string;
  items: {
    label: string;
    value: number;
    color: string;
  }[];
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  let cursor = 0;
  const gradient =
    total === 0
      ? "#e3e4e8"
      : `conic-gradient(${items
          .map((item) => {
            const start = cursor;
            const end = cursor + (item.value / total) * 100;
            cursor = end;
            return `${item.color} ${start}% ${end}%`;
          })
          .join(", ")})`;

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, flex: 1, minWidth: 260 }}>
      <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
      <Stack direction="row" spacing={2} sx={{ mt: 2, alignItems: "center" }}>
        <Box
          sx={{
            width: 112,
            height: 112,
            flex: "0 0 auto",
            borderRadius: "50%",
            background: gradient,
            display: "grid",
            placeItems: "center",
          }}
        >
          <Box
            sx={{
              width: 58,
              height: 58,
              borderRadius: "50%",
              bgcolor: "background.paper",
              display: "grid",
              placeItems: "center",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {total === 0 ? "Нет данных" : total}
            </Typography>
          </Box>
        </Box>
        <Stack spacing={1} sx={{ minWidth: 0 }}>
          {items.map((item) => (
            <Stack key={item.label} direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: item.color, flex: "0 0 auto" }} />
              <Typography variant="body2" sx={{ minWidth: 0 }}>
                {item.label}: <Box component="span" sx={{ fontWeight: 700 }}>{item.value}</Box>
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}

function TechnicalSecurityMeasureDocumentsSection({
  documents,
  isLoading,
  isUploading,
  isDeleting,
  onUpload,
  onDownload,
  onDelete,
}: {
  documents: TechnicalSecurityMeasureDocument[];
  isLoading: boolean;
  isUploading: boolean;
  isDeleting: boolean;
  onUpload: (file: File) => void;
  onDownload: (documentItem: TechnicalSecurityMeasureDocument) => Promise<void>;
  onDelete: (documentId: number) => void;
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
            <Typography sx={{ fontWeight: 700 }}>Документы по техническим мерам защиты</Typography>
            <Typography variant="body2" color="text.secondary">
              Общие подтверждающие документы модуля для выбранной ИСПДн.
            </Typography>
          </Box>
          <Button component="label" variant="contained" startIcon={<UploadFileIcon />} disabled={isUploading}>
            Загрузить документ
            <input type="file" accept=".pdf,.docx" hidden onChange={handleUpload} />
          </Button>
        </Stack>

        {isLoading && (
          <Typography variant="body2" color="text.secondary">
            Загрузка документов
          </Typography>
        )}

        {!isLoading && documents.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            Документы ещё не загружены.
          </Typography>
        )}

        {documents.length > 0 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Файл</TableCell>
                  <TableCell sx={{ width: 140 }}>Размер</TableCell>
                  <TableCell sx={{ width: 180 }}>Дата загрузки</TableCell>
                  <TableCell align="right" sx={{ width: 120 }}>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documents.map((documentItem) => (
                  <TableRow key={documentItem.id}>
                    <TableCell>{documentItem.fileName}</TableCell>
                    <TableCell>{formatFileSize(documentItem.fileSizeBytes)}</TableCell>
                    <TableCell>{formatDate(documentItem.createdAt)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Скачать">
                        <IconButton size="small" onClick={() => void onDownload(documentItem)}>
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Удалить">
                        <span>
                          <IconButton size="small" color="error" disabled={isDeleting} onClick={() => onDelete(documentItem.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>
    </Paper>
  );
}

const TechnicalSecurityMeasureRow = memo(function TechnicalSecurityMeasureRow({
  item,
  onSave,
}: {
  item: TechnicalSecurityMeasure;
  onSave: (payload: TechnicalSecurityMeasureUpdatePayload) => Promise<unknown>;
}) {
  const [draftFactualStatus, setDraftFactualStatus] = useState<TechnicalMeasureFactualStatus>(item.factualStatus);
  const [draftComment, setDraftComment] = useState(item.comment ?? "");
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const chipColor = item.regulatoryStatus === "base_set" ? "primary" : "default";
  const draftCommentRequired =
    (item.regulatoryStatus === "base_set" && draftFactualStatus === "not_implemented") ||
    (item.regulatoryStatus === "not_base_set" && draftFactualStatus === "implemented");

  useEffect(() => {
    setDraftFactualStatus(item.factualStatus);
    setDraftComment(item.comment ?? "");
    setIsEditingComment(false);
  }, [item.factualStatus, item.comment, item.hasComment]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        factualStatus: draftFactualStatus,
        comment: draftComment,
      });
      setIsEditingComment(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <TableRow hover>
      <TableCell>
        <Typography sx={{ fontFamily: "monospace", fontWeight: 700 }}>{item.code}</Typography>
      </TableCell>
      <TableCell>{item.content}</TableCell>
      <TableCell>
        <Chip size="small" color={chipColor} variant={chipColor === "default" ? "outlined" : "filled"} label={item.regulatoryStatusLabel} />
      </TableCell>
      <TableCell>
        <Stack spacing={1}>
          <FormControl fullWidth size="small">
            <Select
              value={draftFactualStatus}
              onChange={(event) => setDraftFactualStatus(event.target.value as TechnicalMeasureFactualStatus)}
            >
              <MenuItem value="implemented">внедрена</MenuItem>
              <MenuItem value="not_implemented">не внедрена</MenuItem>
            </Select>
          </FormControl>
          <Button size="small" variant="outlined" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Сохранение..." : "Сохранить"}
          </Button>
        </Stack>
      </TableCell>
      <TableCell>
        <Stack spacing={1}>
          {!isEditingComment && item.hasComment && (
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                <Button
                  size="small"
                  variant="text"
                  endIcon={<ExpandMoreIcon />}
                  onClick={() => setIsCommentOpen((current) => !current)}
                >
                  Комментарий зафиксирован
                </Button>
                <Tooltip title="Редактировать">
                  <IconButton size="small" onClick={() => setIsEditingComment(true)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
              <Collapse in={isCommentOpen}>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {item.comment}
                </Typography>
              </Collapse>
            </Stack>
          )}

          {!isEditingComment && !item.hasComment && (
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                Комментарий не заполнен
              </Typography>
              {item.commentRequired && <Chip size="small" color="warning" label="Требуется комментарий" sx={{ alignSelf: "flex-start" }} />}
              <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => setIsEditingComment(true)} sx={{ alignSelf: "flex-start" }}>
                Редактировать
              </Button>
            </Stack>
          )}

          {isEditingComment && (
            <Stack spacing={1}>
              <TextField
                label="Комментарий"
                multiline
                minRows={2}
                value={draftComment}
                onChange={(event) => setDraftComment(event.target.value)}
                helperText={
                  draftCommentRequired
                    ? "Комментарий обязателен при расхождении статуса по приказу и фактического статуса."
                    : "Комментарий необязателен."
                }
              />
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="contained" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Сохранение..." : "Сохранить"}
                </Button>
                <Button
                  size="small"
                  variant="text"
                  disabled={isSaving}
                  onClick={() => {
                    setDraftFactualStatus(item.factualStatus);
                    setDraftComment(item.comment ?? "");
                    setIsEditingComment(false);
                  }}
                >
                  Отмена
                </Button>
              </Stack>
            </Stack>
          )}
        </Stack>
      </TableCell>
    </TableRow>
  );
});

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
