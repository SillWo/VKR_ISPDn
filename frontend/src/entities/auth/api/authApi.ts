import { httpClient } from "../../../shared/api/httpClient";
import type { AuthTokenResponse, AuthUser, LoginPayload, RegisterPayload } from "../model/types";

type AuthUserDto = {
  id: number;
  username: string;
  organization_id: number;
  organization_name: string;
  employee_id: number | null;
  is_owner: boolean;
};

type AuthTokenResponseDto = {
  access_token: string;
  token_type: "bearer";
  user: AuthUserDto;
};

function mapUser(dto: AuthUserDto): AuthUser {
  return {
    id: dto.id,
    username: dto.username,
    organizationId: dto.organization_id,
    organizationName: dto.organization_name,
    employeeId: dto.employee_id,
    isOwner: dto.is_owner,
  };
}

function mapTokenResponse(dto: AuthTokenResponseDto): AuthTokenResponse {
  return {
    accessToken: dto.access_token,
    tokenType: dto.token_type,
    user: mapUser(dto.user),
  };
}

export function login(payload: LoginPayload) {
  return httpClient<AuthTokenResponseDto>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({
      username: payload.username.trim(),
      password: payload.password,
    }),
  }).then(mapTokenResponse);
}

export function register(payload: RegisterPayload) {
  return httpClient<AuthTokenResponseDto>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({
      organization_name: payload.organizationName.trim(),
      username: payload.username.trim(),
      password: payload.password,
    }),
  }).then(mapTokenResponse);
}

export function getMe() {
  return httpClient<AuthUserDto>("/api/v1/auth/me").then(mapUser);
}

export function logout() {
  return httpClient<void>("/api/v1/auth/logout", { method: "POST" });
}

export function deleteOrganization() {
  return httpClient<void>("/api/v1/auth/organization", { method: "DELETE" });
}
