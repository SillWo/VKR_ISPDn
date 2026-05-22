import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Box, Button, Link, Paper, Stack, TextField, Typography } from "@mui/material";
import { useForm } from "react-hook-form";
import { Link as RouterLink, Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";

import { useAuth } from "./AuthProvider";

const schema = z.object({
  organizationName: z.string().trim().min(1, "Введите полное наименование организации"),
  username: z.string().trim().min(3, "Минимум 3 символа"),
  password: z.string().min(6, "Минимум 6 символов"),
});

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { organizationName: "", username: "", password: "" },
  });

  if (auth.isAuthenticated) {
    return <Navigate to="/ispdns" replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      await auth.register(values);
      navigate("/ispdns", { replace: true });
    } catch {
      setError("root", { message: "Не удалось зарегистрировать пользователя" });
    }
  });

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "background.default", p: 2 }}>
      <Paper component="form" onSubmit={onSubmit} variant="outlined" sx={{ width: "100%", maxWidth: 460, p: 3 }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography component="h1" variant="h5" sx={{ fontWeight: 600 }}>
              Регистрация
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Создание организации и владельца
            </Typography>
          </Box>

          {errors.root?.message && <Alert severity="error">{errors.root.message}</Alert>}

          <TextField label="Полное наименование организации" error={Boolean(errors.organizationName)} helperText={errors.organizationName?.message} {...register("organizationName")} />
          <TextField label="Имя пользователя" autoComplete="username" error={Boolean(errors.username)} helperText={errors.username?.message} {...register("username")} />
          <TextField label="Пароль" type="password" autoComplete="new-password" error={Boolean(errors.password)} helperText={errors.password?.message} {...register("password")} />

          <Button type="submit" variant="contained" disabled={isSubmitting}>
            Зарегистрироваться
          </Button>

          <Typography variant="body2" color="text.secondary">
            Уже есть учетная запись?{" "}
            <Link component={RouterLink} to="/login">
              Войти
            </Link>
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
