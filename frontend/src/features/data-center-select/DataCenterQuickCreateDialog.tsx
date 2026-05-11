import { Alert, Box, Dialog, DialogContent, DialogTitle } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createDataCenter } from "../../entities/data-center/api/dataCenterApi";
import type { DataCenterFormValues, DataCenterOption } from "../../entities/data-center/model/types";
import { defaultDataCenterFormValues } from "../data-center-form/model/schema";
import { DataCenterForm } from "../data-center-form/ui/DataCenterForm";

type DataCenterQuickCreateDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (dataCenter: DataCenterOption) => void;
};

export function DataCenterQuickCreateDialog({
  open,
  onClose,
  onCreated,
}: DataCenterQuickCreateDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createDataCenter,
    onSuccess: async (dataCenter) => {
      await queryClient.invalidateQueries({ queryKey: ["dataCenters"] });
      await queryClient.invalidateQueries({ queryKey: ["dataCenterOptions"] });
      onCreated({
        id: dataCenter.id,
        name: dataCenter.name,
        locationCountry: dataCenter.locationCountry,
        locationAddress: dataCenter.locationAddress,
        isOwnDataCenter: dataCenter.isOwnDataCenter,
        ownerDisplayName: dataCenter.isOwnDataCenter
          ? "Собственный ЦОД"
          : dataCenter.ownerPersonFullName ?? dataCenter.ownerOrganizationName ?? "",
      });
    },
  });

  const handleSubmit = (values: DataCenterFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onClose={mutation.isPending ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>Создать ЦОД</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {mutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Не удалось создать ЦОД. Проверьте обязательные поля.
            </Alert>
          )}
          <DataCenterForm
            defaultValues={defaultDataCenterFormValues}
            submitLabel="Создать ЦОД"
            isSubmitting={mutation.isPending}
            onSubmit={handleSubmit}
            onCancel={onClose}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
}
