import { Alert, Box, Dialog, DialogContent, DialogTitle } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createControlEvent } from "../../../entities/control-event/api/controlEventApi";
import type { ControlEventFormValues, ControlEventOption } from "../../../entities/control-event/model/types";
import { defaultControlEventFormValues } from "../../control-event-form/model/schema";
import { ControlEventForm } from "../../control-event-form/ui/ControlEventForm";

type ControlEventQuickCreateDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (controlEvent: ControlEventOption) => void;
};

export function ControlEventQuickCreateDialog({
  open,
  onClose,
  onCreated,
}: ControlEventQuickCreateDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createControlEvent,
    onSuccess: async (controlEvent) => {
      await queryClient.invalidateQueries({ queryKey: ["controlEvents"] });
      await queryClient.invalidateQueries({ queryKey: ["controlEventOptions"] });
      onCreated({
        id: controlEvent.id,
        name: controlEvent.name,
        description: controlEvent.description,
      });
    },
  });

  const handleSubmit = (values: ControlEventFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onClose={mutation.isPending ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Создать контрольное мероприятие</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {mutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Не удалось создать контрольное мероприятие. Проверьте данные или уникальность названия.
            </Alert>
          )}
          <ControlEventForm
            defaultValues={defaultControlEventFormValues}
            submitLabel="Создать мероприятие"
            isSubmitting={mutation.isPending}
            onSubmit={handleSubmit}
            onCancel={onClose}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
}
