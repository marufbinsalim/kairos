import { loadAuth, loadConfig } from './config';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const config = loadConfig();
  const auth = loadAuth();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (auth?.accessToken) headers['Authorization'] = `Bearer ${auth.accessToken}`;

  const res = await fetch(`${config.apiUrl}/api${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API error ${res.status}: ${body}`);
  }
  if (res.status === 204 || res.headers.get('content-length') === '0') return {} as T;
  return res.json() as Promise<T>;
}

export const api = {
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  get: <T>(path: string) => request<T>(path),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
