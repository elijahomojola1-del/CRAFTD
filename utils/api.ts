import { API_BASE_URL } from '../config/api';
import { getToken } from './tokenStorage';

// Turns an error reply from the server into one sentence for the user.
// The API answers either {detail: "..."} or {field: ["...", ...]}.
export function apiErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback;
  if (Array.isArray(data)) return typeof data[0] === 'string' ? data[0] : fallback;

  const record = data as Record<string, unknown>;
  if (typeof record.detail === 'string') return record.detail;

  for (const value of Object.values(record)) {
    if (typeof value === 'string') return value;
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  }
  return fallback;
}

export interface ApiResult<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  // A sentence to show the user when ok is false.
  error: string;
}

// JSON request with the login token attached. Never throws: a network
// failure comes back as ok: false with a message to show.
export async function apiRequest<T = any>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean; fallbackError?: string } = {}
): Promise<ApiResult<T>> {
  const { method = 'GET', body, auth = true, fallbackError = 'Something went wrong. Please try again.' } = options;

  try {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth) {
      const token = await getToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      // No body (e.g. 204) or not JSON.
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
      error: response.ok ? '' : apiErrorMessage(data, fallbackError),
    };
  } catch {
    return {
      ok: false,
      status: 0,
      data: null,
      error: 'Could not reach the server. Check your connection and try again.',
    };
  }
}
