import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";

type UnsavedChangesDialogProps = {
  open: boolean;
  isSaving?: boolean;
  onCancel: () => void;
  onDiscard: () => void;
  onSave: () => void;
};

export function UnsavedChangesDialog({
  open,
  isSaving = false,
  onCancel,
  onDiscard,
  onSave,
}: UnsavedChangesDialogProps) {
  return (
    <Dialog open={open} onClose={isSaving ? undefined : onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>Остались несохранённые изменения</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary">
          У вас остались несохранённые изменения на странице, сохранить их?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onDiscard} disabled={isSaving}>
          Отменить
        </Button>
        <Button variant="contained" onClick={onSave} disabled={isSaving}>
          {isSaving ? "Сохранение..." : "Сохранить"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
