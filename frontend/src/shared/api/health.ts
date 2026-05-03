import { httpClient } from "./httpClient";

export type HealthResponse = {
  status: string;
  api_version?: string;
};

export function getApiHealth() {
  return httpClient<HealthResponse>("/api/v1/health");
}
