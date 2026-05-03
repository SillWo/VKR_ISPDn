import { Alert, Box, Paper, Stack, Typography } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { createIspdn } from "../../entities/ispdn/api/ispdnApi";
import { defaultIspdnFormValues } from "../../features/ispdn-card-form/model/schema";
import { IspdnCardForm } from "../../features/ispdn-card-form/ui/IspdnCardForm";

export function IspdnCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createIspdn,
    onSuccess: async (card) => {
      await queryClient.invalidateQueries({ queryKey: ["ispdns"] });
      navigate(`/ispdns/${card.id}`);
    },
  });

  return (
    <Stack spacing={3}>
      <Box>
        <Typography component="h1" variant="h5" sx={{ fontWeight: 600 }}>
          Создание карточки ИСПДн
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 760 }}>
          Заполните обязательные сведения, которые будут сохранены в backend и появятся в реестре ИСПДн.
        </Typography>
      </Box>

      {mutation.isError && <Alert severity="error">Не удалось сохранить карточку ИСПДн. Проверьте заполнение полей и доступность API.</Alert>}

      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, bgcolor: "background.paper" }}>
        <IspdnCardForm
          defaultValues={defaultIspdnFormValues}
          submitLabel="Создать ИСПДн"
          isSubmitting={mutation.isPending}
          onSubmit={(values) => mutation.mutate(values)}
          onCancel={() => navigate("/ispdns")}
        />
      </Paper>
    </Stack>
  );
}
