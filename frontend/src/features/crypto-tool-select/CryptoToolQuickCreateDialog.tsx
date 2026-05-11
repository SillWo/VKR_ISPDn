import { Alert, Box, Dialog, DialogContent, DialogTitle } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createCryptoTool, toCryptoToolOption } from "../../entities/crypto-tool/api/cryptoToolApi";
import type { CryptoToolFormValues, CryptoToolOption } from "../../entities/crypto-tool/model/types";
import { defaultCryptoToolFormValues } from "../crypto-tool-form/model/schema";
import { CryptoToolForm } from "../crypto-tool-form/ui/CryptoToolForm";

type CryptoToolQuickCreateDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (cryptoTool: CryptoToolOption) => void;
};

export function CryptoToolQuickCreateDialog({
  open,
  onClose,
  onCreated,
}: CryptoToolQuickCreateDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createCryptoTool,
    onSuccess: async (cryptoTool) => {
      await queryClient.invalidateQueries({ queryKey: ["cryptoTools"] });
      await queryClient.invalidateQueries({ queryKey: ["cryptoToolOptions"] });
      onCreated(toCryptoToolOption(cryptoTool));
    },
  });

  const handleSubmit = (values: CryptoToolFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onClose={mutation.isPending ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Создать СКЗИ</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {mutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Не удалось создать СКЗИ. Проверьте обязательные поля.
            </Alert>
          )}
          <CryptoToolForm
            defaultValues={defaultCryptoToolFormValues}
            submitLabel="Создать СКЗИ"
            isSubmitting={mutation.isPending}
            onSubmit={handleSubmit}
            onCancel={onClose}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
}
