const configuredBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL;

export const API_BASE_URL = configuredBaseUrl || "http://127.0.0.1:5050";

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function readApiError(response: Response, fallback: string) {
  try {
    const data = await response.json();
    return data.message || data.detail || fallback;
  } catch {
    return fallback;
  }
}
