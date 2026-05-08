import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DownloadIcon from "@mui/icons-material/Download";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
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
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChangeEvent, Fragment, useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";

import {
  downloadTechnicalSecurityMeasureJustificationFile,
  getTechnicalSecurityMeasures,
  updateTechnicalSecurityMeasure,
} from "../../entities/security-measure/api/securityMeasureApi";
import type {
  TechnicalMeasureFactualStatus,
  TechnicalSecurityMeasure,
  TechnicalSecurityMeasureUpdatePayload,
} from "../../entities/security-measure/model/types";
import { HttpError } from "../../shared/api/httpClient";

type RowDraft = {
  factualStatus: TechnicalMeasureFactualStatus;
  justificationText: string;
  justificationFile: File | null;
};

export function IspdnSecurityMeasuresPage() {
  const { ispdnId } = useParams();
  const queryClient = useQueryClient();
  const numericId = Number(ispdnId);
  const isValidId = Number.isInteger(numericId) && numericId > 0;
  const [drafts, setDrafts] = useState<Record<string, RowDraft>>({});

  const measuresQuery = useQuery({
    queryKey: ["technicalSecurityMeasures", numericId],
    queryFn: () => getTechnicalSecurityMeasures(numericId),
    enabled: isValidId,
    retry: false,
  });

  useEffect(() => {
    if (!measuresQuery.data) {
      return;
    }
    setDrafts(
      Object.fromEntries(
        measuresQuery.data.items.map((item) => [
          item.code,
          {
            factualStatus: item.factualStatus,
            justificationText: item.justificationText ?? "",
            justificationFile: null,
          },
        ]),
      ),
    );
  }, [measuresQuery.data]);

  const updateMutation = useMutation({
    mutationFn: ({ measureCode, payload }: { measureCode: string; payload: TechnicalSecurityMeasureUpdatePayload }) =>
      updateTechnicalSecurityMeasure(numericId, measureCode, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["technicalSecurityMeasures", numericId] });
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
        <Alert severity="error">
          Не удалось сохранить меру. Проверьте статус, обязательное обоснование и формат файла.
        </Alert>
      )}

      {updateMutation.isSuccess && <Alert severity="success">Изменения по мере сохранены.</Alert>}

      {measuresQuery.data && (
        <>
          <Summary table={measuresQuery.data} />
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 120 }}>Код меры по приказу</TableCell>
                  <TableCell>Содержание меры по приказу</TableCell>
                  <TableCell sx={{ width: 170 }}>Статус по приказу</TableCell>
                  <TableCell sx={{ width: 260 }}>Фактический статус</TableCell>
                  <TableCell sx={{ width: 280 }}>Документы</TableCell>
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
                      <MeasureRow
                        key={item.code}
                        ispdnId={numericId}
                        item={item}
                        draft={drafts[item.code]}
                        isSaving={updateMutation.isPending}
                        onDraftChange={(draft) => setDrafts((current) => ({ ...current, [item.code]: draft }))}
                        onSave={() => {
                          const draft = drafts[item.code];
                          if (!draft) {
                            return;
                          }
                          updateMutation.mutate({ measureCode: item.code, payload: draft });
                        }}
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

function Summary({ table }: { table: NonNullable<Awaited<ReturnType<typeof getTechnicalSecurityMeasures>>> }) {
  const items = [
    ["Рассчитанный уровень защищённости", table.recommendedLevel],
    ["Фактический уровень защищённости", table.actualLevel],
    ["Всего мер", table.summary.totalCount],
    ["Базовый набор", table.summary.baseSetCount],
    ["Не базовый набор", table.summary.notBaseSetCount],
    ["Внедрено", table.summary.implementedCount],
    ["Не внедрено", table.summary.notImplementedCount],
    ["Требуют обоснования", table.summary.justificationRequiredCount],
    ["Не хватает обязательного обоснования", table.summary.missingRequiredJustificationCount],
  ];

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
      <Stack direction={{ xs: "column", md: "row" }} sx={{ flexWrap: "wrap", gap: 1.5 }}>
        {items.map(([label, value]) => (
          <Box key={label} sx={{ minWidth: 180 }}>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography sx={{ fontWeight: 700 }}>{value}</Typography>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

function MeasureRow({
  ispdnId,
  item,
  draft,
  isSaving,
  onDraftChange,
  onSave,
}: {
  ispdnId: number;
  item: TechnicalSecurityMeasure;
  draft?: RowDraft;
  isSaving: boolean;
  onDraftChange: (draft: RowDraft) => void;
  onSave: () => void;
}) {
  const currentDraft = draft ?? {
    factualStatus: item.factualStatus,
    justificationText: item.justificationText ?? "",
    justificationFile: null,
  };
  const chipColor = item.regulatoryStatus === "base_set" ? "primary" : "default";
  const draftJustificationRequired =
    (item.regulatoryStatus === "base_set" && currentDraft.factualStatus === "not_implemented") ||
    (item.regulatoryStatus === "not_base_set" && currentDraft.factualStatus === "implemented");

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    onDraftChange({ ...currentDraft, justificationFile: event.target.files?.[0] ?? null });
  };

  const handleDownload = async () => {
    const blob = await downloadTechnicalSecurityMeasureJustificationFile(ispdnId, item.code);
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
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
              value={currentDraft.factualStatus}
              onChange={(event) =>
                onDraftChange({ ...currentDraft, factualStatus: event.target.value as TechnicalMeasureFactualStatus })
              }
            >
              <MenuItem value="implemented">внедрена</MenuItem>
              <MenuItem value="not_implemented">не внедрена</MenuItem>
            </Select>
          </FormControl>
          {draftJustificationRequired && (
            <TextField
              label="Краткое обоснование"
              multiline
              minRows={2}
              value={currentDraft.justificationText}
              onChange={(event) => onDraftChange({ ...currentDraft, justificationText: event.target.value })}
              helperText="Обоснование требуется из-за расхождения статусов."
            />
          )}
        </Stack>
      </TableCell>
      <TableCell>
        <Stack spacing={1}>
          {item.justificationFileName && (
            <Button size="small" variant="text" startIcon={<DownloadIcon />} onClick={handleDownload}>
              {item.justificationFileName}
            </Button>
          )}
          {currentDraft.justificationFile && (
            <Typography variant="body2" color="text.secondary">
              Выбран файл: {currentDraft.justificationFile.name}
            </Typography>
          )}
          <Button component="label" size="small" variant="outlined" startIcon={<UploadFileIcon />}>
            Прикрепить .pdf/.docx
            <input type="file" accept=".pdf,.docx" hidden onChange={handleFileChange} />
          </Button>
          <Button size="small" variant="contained" onClick={onSave} disabled={isSaving}>
            {isSaving ? "Сохранение..." : "Сохранить"}
          </Button>
        </Stack>
      </TableCell>
    </TableRow>
  );
}
