import { useEffect, useState } from 'react';
import { getCompanyApi, getPublicCompanyApi, companyLogoUrl } from './api';
import { getToken } from './auth';
import { CompanyInfo } from '../types';

const CODE_KEY = 'company_code';

export const getSavedCompanyCode = (): string => {
  try {
    return localStorage.getItem(CODE_KEY) || '';
  } catch {
    return '';
  }
};
export const saveCompanyCode = (code: string) => {
  try {
    localStorage.setItem(CODE_KEY, code.trim().toUpperCase());
  } catch {
    // storage nahi
  }
};

// Login badalne par (ya code badalne par) naya data aaye: cache key me token + code
const keyNow = () => `${getToken() || ''}|${getSavedCompanyCode()}`;
const cache = new Map<string, CompanyInfo>();
const listeners = new Set<() => void>();

// Admin company ka naam/logo badle to sabhi screens ko naya mil jaye
export function setCompanyCache(c: CompanyInfo) {
  cache.set(keyNow(), c);
  listeners.forEach((l) => l());
}

// Company ka naam, code aur logo (logo url ready-to-use)
export function useCompany() {
  const [, force] = useState(0);
  const key = keyNow();

  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  useEffect(() => {
    if (cache.has(key)) return;
    const token = getToken();
    const code = getSavedCompanyCode();
    const req = token ? getCompanyApi() : code ? getPublicCompanyApi(code) : null;
    if (!req) return;
    let alive = true;
    req
      .then((c) => {
        cache.set(key, c);
        if (alive) force((n) => n + 1);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [key]);

  const c = cache.get(key) || null;
  const code = c?.code || getSavedCompanyCode();
  return {
    name: c?.name || '',
    code,
    empPrefix: c?.empPrefix || 'EMP',
    logoUrl: c?.hasLogo && code ? companyLogoUrl(code, c.updatedAt) : null,
  };
}
