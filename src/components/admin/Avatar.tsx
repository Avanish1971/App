import { useEffect, useState } from 'react';

const COLORS = ['bg-indigo-500', 'bg-emerald-500', 'bg-cyan-600', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500', 'bg-teal-600'];

// Photo dikhao; photo na ho ya khul na paaye to naam ke pehle akshar wala gol avatar
export function Avatar({ src, name, className = '' }: { src?: string; name?: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  if (!src || failed) {
    const initials = (name || '?')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join('');
    const color = COLORS[(name || '').length % COLORS.length];
    return (
      <div className={`${className} ${color} text-white font-bold flex items-center justify-center text-[10px] leading-none select-none`} title={name}>
        {initials || '?'}
      </div>
    );
  }
  return <img src={src} alt={name || ''} referrerPolicy="no-referrer" className={className} onError={() => setFailed(true)} />;
}
