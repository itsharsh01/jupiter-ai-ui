import { apiUrl, AUTH_TOKEN_KEY, AUTH_USER_KEY, authHeaders } from './config';

export interface AuthUser {
  customer_id: string;
  email: string;
  name: string;
  company?: string | null;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
}

async function parseJson<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = (body as { detail?: string }).detail ?? res.statusText;
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }
  return body as T;
}

export function loadStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function getStoredCustomerId(): string | null {
  return loadStoredUser()?.customer_id ?? null;
}

export function persistSession(response: LoginResponse): void {
  localStorage.setItem(AUTH_TOKEN_KEY, response.access_token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
}

export function clearSession(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(apiUrl('/api/v1/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await parseJson<LoginResponse>(res);
  persistSession(data);
  return data;
}

export async function register(
  email: string,
  password: string,
  name?: string,
  company?: string,
): Promise<LoginResponse> {
  const res = await fetch(apiUrl('/api/v1/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      name: name?.trim() || undefined,
      company: company?.trim() || undefined,
    }),
  });
  const data = await parseJson<LoginResponse>(res);
  persistSession(data);
  return data;
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const res = await fetch(apiUrl('/api/v1/auth/me'), {
    headers: authHeaders(),
  });
  const user = await parseJson<AuthUser>(res);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  return user;
}
