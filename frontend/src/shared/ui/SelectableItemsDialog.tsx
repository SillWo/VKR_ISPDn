import {
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState, type ReactNode } from "react";

type SelectableItemsDialogProps<TItem> = {
  open: boolean;
  title: string;
  items: readonly TItem[];
  selectedIds: number[];
  getId: (item: TItem) => number;
  getPrimary: (item: TItem) => string;
  getSecondary?: (item: TItem) => ReactNode;
  emptyText?: string;
  disabled?: boolean;
  onClose: () => void;
  onConfirm: (ids: number[]) => void;
};

export function SelectableItemsDialog<TItem>({
  open,
  title,
  items,
  selectedIds,
  getId,
  getPrimary,
  getSecondary,
  emptyText = "Нет доступных записей",
  disabled = false,
  onClose,
  onConfirm,
}: SelectableItemsDialogProps<TItem>) {
  const [draftIds, setDraftIds] = useState<number[]>(selectedIds);
  const draftIdSet = useMemo(() => new Set(draftIds), [draftIds]);

  useEffect(() => {
    if (open) {
      setDraftIds(selectedIds);
    }
  }, [open, selectedIds]);

  const toggleId = (id: number) => {
    setDraftIds((current) => {
      const currentIds = new Set(current);
      return currentIds.has(id) ? current.filter((itemId) => itemId !== id) : [...current, id];
    });
  };

  return (
    <Dialog open={open} onClose={disabled ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        {items.length === 0 ? (
          <Typography color="text.secondary">{emptyText}</Typography>
        ) : (
          <List disablePadding>
            {items.map((item) => {
              const id = getId(item);
              const checked = draftIdSet.has(id);

              return (
                <ListItemButton key={id} onClick={() => toggleId(id)} disabled={disabled} dense>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Checkbox edge="start" checked={checked} tabIndex={-1} disableRipple />
                  </ListItemIcon>
                  <ListItemText primary={getPrimary(item)} secondary={getSecondary?.(item)} />
                </ListItemButton>
              );
            })}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose} disabled={disabled}>
          Отмена
        </Button>
        <Button variant="contained" onClick={() => onConfirm(draftIds)} disabled={disabled}>
          Применить
        </Button>
      </DialogActions>
    </Dialog>
  );
}
