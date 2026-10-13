import { prepareListingPhoto } from './image-upload';
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

export type UploadProgress = {
  stage: 'preparing' | 'sending' | 'saving';
  photo: number;
  total: number;
  percent: number;
};

// Keep acknowledgements on this page for retries; do not retry ambiguous network failures automatically.
const uploadedPhotos = new WeakMap<File, Map<string, unknown[]>>();

function sendPhoto(path: string, file: File, onProgress: (percent: number) => void): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL}${path}`);
    xhr.timeout = 180000;
    const token = getAccessToken();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.onprogress = event => {
      if (event.lengthComputable) onProgress(Math.round(event.loaded / event.total * 100));
    };
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new ApiError(xhr.status, xhr.status === 413 ? 'Photo trop volumineuse pour le serveur.' : xhr.responseText || 'Envoi de photo impossible.'));
        return;
      }
      try {
        const data = JSON.parse(xhr.responseText);
        resolve(Array.isArray(data) ? data : [data]);
      } catch {
        reject(new Error('Réponse du serveur invalide après envoi de la photo.'));
      }
    };
    xhr.onerror = () => reject(new Error('Connexion interrompue. Vérifiez les photos de votre brouillon avant de réessayer.'));
    xhr.ontimeout = () => reject(new Error('Envoi trop long. Vérifiez les photos de votre brouillon avant de réessayer.'));
    const body = new FormData();
    body.append('files', file);
    xhr.send(body);
  });
}

export async function uploadFiles(path: string, files: File[], onProgress?: (progress: UploadProgress) => void) {
  const result: unknown[] = [];
  for (let index = 0; index < files.length; index++) {
    const original = files[index];
    const confirmed = uploadedPhotos.get(original)?.get(path);
    if (confirmed) {
      result.push(...confirmed);
      continue;
    }
    const report = (stage: UploadProgress['stage'], percent: number) =>
      onProgress?.({ stage, photo: index + 1, total: files.length, percent });
    report('preparing', 0);
    const photo = await prepareListingPhoto(original);
    const transfer = () => sendPhoto(path, photo, percent => report(percent === 100 ? 'saving' : 'sending', percent));
    report('sending', 0);
    let response: unknown[];
    try {
      response = await transfer();
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401 || !await tryRefreshToken()) throw error;
      response = await transfer();
    }
    const paths = uploadedPhotos.get(original) || new Map<string, unknown[]>();
    paths.set(path, response);
    uploadedPhotos.set(original, paths);
    result.push(...response);
    report('saving', 100);
  }
  return result;
}