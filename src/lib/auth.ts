import { Capacitor } from '@capacitor/core';

export type Role = 'admin' | 'employee';

// Phone ka app (APK) ya URL me ?view=mobile  => employee wala hissa. Baaki sab => admin.
export function isMobileView(): boolean {
  if (Capacitor.isNativePlatform()) return true;
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('view') === 'mobile';
}

export const currentRole = (): Role => (isMobileView() ? 'employee' : 'admin');

const KEYS: Record<Role, string> = {
  admin: 'geoattend_admin_token',
  employee: 'geoattend_employee_token',
};

export const AUTH_EXPIRED_EVENT = 'geoattend:auth-expired';

export function getToken(role: Role = currentRole()): string | null {
  try {
    return localStorage.getItem(KEYS[role]);
  } catch {
    return null;
  }
}

export function setToken(role: Role, token: string) {
  try {
    localStorage.setItem(KEYS[role], token);
  } catch {
    // private mode me storage band ho sakta hai
  }
}

export function clearToken(role: Role = currentRole()) {
  try {
    localStorage.removeItem(KEYS[role]);
  } catch {
    // kuch nahi
  }
}

// Token abhi tak chalta hai ya expire ho gaya (sirf time dekhta hai; asli jaanch server karta hai)
export function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  try {
    const body = token.split('.')[0].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(body));
    return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}
