import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";

import * as authApi from "../../entities/auth/api/authApi";
import type { AuthUser, LoginPayload, RegisterPayload } from "../../entities/auth/model/types";
import { clearStoredToken, getStoredToken, setStoredToken } from "./authStorage";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  clearAuth: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuth = useCallback(() => {
    clearStoredToken();
    queryClient.clear();
    setUser(null);
  }, [queryClient]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    authApi
      .getMe()
      .then(setUser)
      .catch(clearAuth)
      .finally(() => setIsLoading(false));
  }, [clearAuth]);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await authApi.login(payload);
    queryClient.clear();
    setStoredToken(response.accessToken);
    setUser(response.user);
  }, [queryClient]);

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await authApi.register(payload);
    queryClient.clear();
    setStoredToken(response.accessToken);
    setUser(response.user);
  }, [queryClient]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      register,
      logout,
      clearAuth,
    }),
    [clearAuth, isLoading, login, logout, register, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}
