const configuredBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL;

<<<<<<< HEAD
export const API_BASE_URL = configuredBaseUrl || "http://127.0.0.1:5051";
=======
export const API_BASE_URL = configuredBaseUrl || "https://cuny-first-0.onrender.com";
>>>>>>> 7f1cb5939bd67e175c908f81f22ee33ab0bd0b13

export function apiUrl(path: string) {
 return `${API_BASE_URL}${path}`;

}

export async function readApiError(response: Response, fallback: string) {
  try {
    const data = await response.json();
    return data.message || data.detail || fallback;
  } catch {
    return fallback;
  }
}
