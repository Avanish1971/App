import { useEffect, useState } from 'react';

const COLORS = ['bg-indigo-500', 'bg-emerald-500', 'bg-cyan-600', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500', 'bg-teal-600'];
const API_BASE = (import.meta as any).env?.VITE_API_URL || 'https://jasmine-edition-panning.ngrok-free.dev';

// Global cache: employee name/id -> avatar URL (taaki jahan sirf employeeName ho wahan bhi photo dikhe)
const avatarCache = new Map<string, string>();
export function registerEmployeeAvatars(list: Array<{ id?: string; fullName?: string; avatar?: string }>) {
  if (!Array.isArray(list)) return;
  for (const e of list) {
    if (e?.avatar) {
      if (e.id) avatarCache.set(String(e.id), e.avatar);
      if (e.fullName) avatarCache.set(e.fullName.trim().toLowerCase(), e.avatar);
    }
  }
}

export function Avatar({ src, name, employeeId, className = '' }: { src?: string; name?: string; employeeId?: string; className?: string }) {
  const resolvedSrc = src || (employeeId ? avatarCache.get(String(employeeId)) : '') || (name ? avatarCache.get(name.trim().toLowerCase()) : '') || '';
  const [blobUrl, setBlobUrl] = useState<string>('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    setBlobUrl('');
    if (!resolvedSrc) return;
    if (resolvedSrc.startsWith('data:') || resolvedSrc.startsWith('blob:')) {
      setBlobUrl(resolvedSrc);
      return;
    }
    const fullUrl = resolvedSrc.startsWith('http') ? resolvedSrc : API_BASE + (resolvedSrc.startsWith('/') ? '' : '/') + resolvedSrc;
    let active = true;
    fetch(fullUrl, { headers: { 'ngrok-skip-browser-warning': 'true' } })
      .then((res) => {
        if (!res.ok) throw new Error('Photo load failed');
        return res.blob();
      })
      .then((blob) => {
        if (active) setBlobUrl(URL.createObjectURL(blob));
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => { active = false; };
  }, [resolvedSrc]);

  if (!resolvedSrc || failed || !blobUrl) {
    const initials = (name || '?')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join('');
    const color = COLORS[(name || '').length % COLORS.length];
    return (
      <div className={`${className} ${color} text-white font-bold flex items-center justify-center text-[10px] leading-none select-none shrink-0`} title={name}>
        {initials || '?'}
      </div>
    );
  }
  return <img src={blobUrl} alt={name || ''} referrerPolicy="no-referrer" className={`${className} shrink-0`} onError={() => setFailed(true)} />;
}
