import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";

import type { Task } from "../../entities/task/model/types";

type DeleteTaskConfirmDialogProps = {
  task: Task | null;
  isDeleting?: boolean;
  onClose: () => void;
  onConfirm: (task: Task) => void;
};

export function DeleteTaskConfirmDialog({
  task,
  isDeleting = false,
  onClose,
  onConfirm,
}: DeleteTaskConfirmDialogProps) {
  return (
    <Dialog open={Boolean(task)} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Удалить задачу</DialogTitle>
      <DialogContent>
        <Typography>
          {task ? `Вы точно хотите удалить задачу «${task.title}»?` : "Вы точно хотите удалить задачу?"}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose} disabled={isDeleting}>
          Отмена
        </Button>
        <Button
          variant="contained"
          color="error"
          disabled={!task || isDeleting}
          onClick={() => task && onConfirm(task)}
        >
          {isDeleting ? "Удаление..." : "Удалить"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
