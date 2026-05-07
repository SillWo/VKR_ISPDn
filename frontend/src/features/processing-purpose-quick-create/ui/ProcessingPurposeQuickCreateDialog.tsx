import { Alert, Box, Dialog, DialogContent, DialogTitle } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createProcessingPurpose } from "../../../entities/processing-purpose/api/processingPurposeApi";
import type {
  ProcessingPurposeFormValues,
  ProcessingPurposeOption,
} from "../../../entities/processing-purpose/model/types";
import { defaultProcessingPurposeFormValues } from "../../processing-purpose-form/model/schema";
import { ProcessingPurposeForm } from "../../processing-purpose-form/ui/ProcessingPurposeForm";

type ProcessingPurposeQuickCreateDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (purpose: ProcessingPurposeOption) => void;
};

export function ProcessingPurposeQuickCreateDialog({
  open,
  onClose,
  onCreated,
}: ProcessingPurposeQuickCreateDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createProcessingPurpose,
    onSuccess: async (purpose) => {
      await queryClient.invalidateQueries({ queryKey: ["processingPurposeOptions"] });
      await queryClient.invalidateQueries({ queryKey: ["processingPurposes"] });
      onCreated({
        id: purpose.id,
        name: purpose.name,
        processingPeriod: purpose.processingPeriod,
      });
    },
  });

  const handleSubmit = (values: ProcessingPurposeFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Создать цель обработки</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {mutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Не удалось создать цель обработки. Проверьте данные или уникальность названия.
            </Alert>
          )}
          <ProcessingPurposeForm
            defaultValues={defaultProcessingPurposeFormValues}
            submitLabel="Создать цель"
            isSubmitting={mutation.isPending}
            onSubmit={handleSubmit}
            onCancel={onClose}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
}
