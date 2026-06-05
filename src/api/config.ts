const envBase = import.meta.env.VITE_API_URL as string | undefined;

/** Base URL for GovernAI API. In dev, Vite proxies `/api` to port 8800. */
export const API_BASE = envBase?.replace(/\/$/, '') ?? '';

export const AUTH_TOKEN_KEY = 'governai_auth_token';
export const AUTH_USER_KEY = 'governai_auth_user';

export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${p}`;
}

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function authHeaders(extra: HeadersInit = {}): HeadersInit {
  const token = getAuthToken();
  if (!token) return extra;
  return { ...extra, Authorization: `Bearer ${token}` };
}
