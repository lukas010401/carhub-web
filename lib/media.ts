import { API_BASE_URL } from './api';

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function trimLeadingSlash(value: string): string {
  return value.replace(/^\/+/, '');
}

export function resolveMediaUrl(input?: string | null): string {
  if (!input) return '';
  const value = String(input).trim();
  if (!value) return '';

  if (value.startsWith('data:') || value.startsWith('blob:')) return value;

  try {
    const absolute = new URL(value);
    const host = absolute.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
      const api = new URL(API_BASE_URL);
      absolute.protocol = api.protocol;
      absolute.host = api.host;
      return absolute.toString();
    }
    return value;
  } catch {
    // Relative path; continue with API_BASE_URL resolution.
  }

  const base = trimTrailingSlash(API_BASE_URL);
  if (value.startsWith('/')) return `${base}${value}`;
  return `${base}/${trimLeadingSlash(value)}`;
}
