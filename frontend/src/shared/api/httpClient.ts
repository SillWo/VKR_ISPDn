const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export async function httpClient<TResponse>(path: string, init?: RequestInit): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json() as Promise<TResponse>;
}
