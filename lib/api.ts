import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from './auth';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5022';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function tryRefreshToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });

  if (!res.ok) {
    clearTokens();
    return false;
  }

  const data = await res.json();
  saveTokens(data);
  return true;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}, withAuth = false): Promise<T> {
  const headers = new Headers(init.headers || {});
  if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (withAuth) {
    const token = getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  let response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

  if (response.status === 401 && withAuth) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const retryHeaders = new Headers(init.headers || {});
      const newToken = getAccessToken();
      if (!retryHeaders.has('Content-Type') && !(init.body instanceof FormData)) {
        retryHeaders.set('Content-Type', 'application/json');
      }
      if (newToken) retryHeaders.set('Authorization', `Bearer ${newToken}`);
      response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers: retryHeaders });
    }
  }

  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(response.status, text || 'API error');
  }

  if (response.status === 204) return {} as T;
  return response.json();
}

export async function uploadFiles(path: string, files: File[]) {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));

  const token = getAccessToken();
  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData
  });

  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json();
}
