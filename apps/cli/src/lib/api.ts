import { loadAuth, clearAuth } from './config';

export const API_BASE = process.env.KAIROS_API_URL ?? 'https://kairoscli-api.onrender.com';
const TIMEOUT_MS = 25_000;

/** HTTP-level failure. `hint` is a CLI command suggestion rendered by BaseCommand. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly hint?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  readonly hint?: string;
  constructor(message = 'Cannot reach Kairos. Check your internet connection and try again.') {
    super(message);
    this.name = 'NetworkError';
  }
}

function extractMessage(body: string): string | null {
  try {
    const json = JSON.parse(body) as { message?: string | string[] };
    if (Array.isArray(json.message)) return json.message.join(', ');
    if (typeof json.message === 'string') return json.message;
    return null;
  } catch {
    return null;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const auth = loadAuth();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  };
  const hasToken = Boolean(auth?.accessToken);
  if (hasToken) headers['Authorization'] = `Bearer ${auth!.accessToken}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api${path}`, { ...options, headers, signal: controller.signal });
  } catch (e: unknown) {
    if ((e as Error)?.name === 'AbortError') {
      throw new NetworkError('Request timed out — the server may be waking up. Try again in a few seconds.');
    }
    throw new NetworkError();
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const message = extractMessage(body);

    if (res.status === 401) {
      if (hasToken) {
        // Authenticated request rejected — the session is no longer valid
        clearAuth();
        throw new ApiError('Your session has expired.', 401, 'kairos login');
      }
      if (path.startsWith('/auth/')) throw new ApiError(message ?? 'Invalid credentials.', 401);
      throw new ApiError('Not logged in.', 401, 'kairos login');
    }
    if (res.status === 403) {
      throw new ApiError(message ?? 'Access denied — this device may have been revoked.', 403, 'kairos switch');
    }
    if (res.status === 404) {
      throw new ApiError(message ?? 'Not found — it may have been deleted.', 404);
    }
    if (res.status >= 500) {
      throw new ApiError('Kairos is having trouble right now. Try again in a moment.', res.status);
    }
    throw new ApiError(message ?? `Request failed (HTTP ${res.status}).`, res.status);
  }

  if (res.status === 204 || res.headers.get('content-length') === '0') return {} as T;
  return res.json() as Promise<T>;
}

export const api = {
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  get: <T>(path: string) => request<T>(path),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
