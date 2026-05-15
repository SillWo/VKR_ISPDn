export type AuthUser = {
  id: number;
  username: string;
  organizationId: number;
  organizationName: string;
  employeeId: number | null;
  isOwner: boolean;
};

export type AuthTokenResponse = {
  accessToken: string;
  tokenType: "bearer";
  user: AuthUser;
};

export type LoginPayload = {
  username: string;
  password: string;
};

export type RegisterPayload = {
  organizationName: string;
  username: string;
  password: string;
};
