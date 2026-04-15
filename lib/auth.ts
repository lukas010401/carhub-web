import { JwtUser, Tokens } from './types';

const ACCESS = 'carhub_access_token';
const REFRESH = 'carhub_refresh_token';

export function saveTokens(tokens: Tokens) {
  localStorage.setItem(ACCESS, tokens.accessToken);
  localStorage.setItem(REFRESH, tokens.refreshToken);
}

export function getAccessToken() {
  return typeof window === 'undefined' ? null : localStorage.getItem(ACCESS);
}

export function getRefreshToken() {
  return typeof window === 'undefined' ? null : localStorage.getItem(REFRESH);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS);
  localStorage.removeItem(REFRESH);
}

export function parseJwt(token: string): JwtUser | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    const fullName = decoded.name
      || decoded.fullName
      || decoded.given_name
      || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name']
      || '';
    const phoneNumber = decoded.phoneNumber
      || decoded.phone_number
      || decoded.phone
      || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/mobilephone']
      || '';
    const whatsAppNumber = decoded.whatsAppNumber
      || decoded.whatsappNumber
      || decoded.whatsapp_number
      || '';
    const profileImageUrl = decoded.profileImageUrl
      || decoded.profile_image_url
      || '';
    const accountType = decoded.accountType
      || decoded.account_type
      || '';
    return {
      sub: decoded.sub,
      email: decoded.email,
      fullName: String(fullName || '').trim() || undefined,
      phoneNumber: String(phoneNumber || '').trim() || undefined,
      whatsAppNumber: String(whatsAppNumber || '').trim() || undefined,
      profileImageUrl: String(profileImageUrl || '').trim() || undefined,
      accountType: String(accountType || '').trim() || undefined,
      role: decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded.role
    };
  } catch {
    return null;
  }
}

export function getCurrentUser(): JwtUser | null {
  const token = getAccessToken();
  return token ? parseJwt(token) : null;
}
