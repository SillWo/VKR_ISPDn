import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Box, Button, Link, Paper, Stack, TextField, Typography } from "@mui/material";
import { useForm } from "react-hook-form";
import { Link as RouterLink, Navigate, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";

import { useAuth } from "./AuthProvider";

const schema = z.object({
  username: z.string().trim().min(1, "Введите имя пользователя"),
  password: z.string().min(1, "Введите пароль"),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" },
  });

  if (auth.isAuthenticated) {
    return <Navigate to="/ispdns" replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      await auth.login(values);
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/ispdns";
      navigate(from, { replace: true });
    } catch {
      setError("root", { message: "Неверное имя пользователя или пароль" });
    }
  });

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "background.default", p: 2 }}>
      <Paper component="form" onSubmit={onSubmit} variant="outlined" sx={{ width: "100%", maxWidth: 420, p: 3 }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography component="h1" variant="h5" sx={{ fontWeight: 600 }}>
              Вход в систему
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Учет и контроль ИСПДн
            </Typography>
          </Box>

          {errors.root?.message && <Alert severity="error">{errors.root.message}</Alert>}

          <TextField label="Имя пользователя" autoComplete="username" error={Boolean(errors.username)} helperText={errors.username?.message} {...register("username")} />
          <TextField label="Пароль" type="password" autoComplete="current-password" error={Boolean(errors.password)} helperText={errors.password?.message} {...register("password")} />

          <Button type="submit" variant="contained" disabled={isSubmitting}>
            Войти
          </Button>

          <Typography variant="body2" color="text.secondary">
            Нет учетной записи?{" "}
            <Link component={RouterLink} to="/register">
              Зарегистрироваться
            </Link>
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
