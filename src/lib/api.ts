'use client';

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface RequestOptions {
  body?: unknown;
  params?: Record<string, string | number | undefined>;
}

function buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
  const base = `/api/proxy/${path.replace(/^\//, '')}`;
  if (!params) return base;
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) query.set(k, String(v));
  }
  const qs = query.toString();
  return qs ? `${base}?${qs}` : base;
}

async function request<T>(method: Method, path: string, opts?: RequestOptions): Promise<T> {
  const url = buildUrl(path, opts?.params);
  const res = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: opts?.body ? { 'Content-Type': 'application/json' } : undefined,
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
  });
  if (res.status === 401) {
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string, params?: Record<string, string | number | undefined>) =>
    request<T>('GET', path, { params }),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, { body }),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, { body }),
  del: <T>(path: string) => request<T>('DELETE', path),
};
