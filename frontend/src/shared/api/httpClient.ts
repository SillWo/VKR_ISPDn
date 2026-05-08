const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export class HttpError extends Error {
  status: number;

  constructor(status: number, statusText: string) {
    super(`HTTP ${status}: ${statusText}`);
    this.status = status;
  }
}

export async function httpClient<TResponse>(path: string, init?: RequestInit): Promise<TResponse> {
  const isFormData = init?.body instanceof FormData;
  const headers = isFormData
    ? init?.headers
    : {
        "Content-Type": "application/json",
        ...init?.headers,
      };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    throw new HttpError(response.status, response.statusText);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return response.json() as Promise<TResponse>;
}

export function buildApiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}
