export const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;

export function getApiUrl(path: string) {
  if (!API_BASE_URL) return undefined;
  return `${API_BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}
