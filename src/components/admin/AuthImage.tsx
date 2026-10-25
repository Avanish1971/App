import { useEffect, useState } from 'react';
import { fetchClientVisitPhotoUrl } from '../../lib/api';
import { ImageOff, Loader2 } from 'lucide-react';

// Photo token ke saath laata hai (seedha <img src> me login nahi chalta). Click karo to bada khulta hai.
export function AuthImage({ visitId, kind, label }: { visitId: string; kind: 'selfie' | 'site'; label: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let created: string | null = null;
    setUrl(null);
    setFailed(false);
    fetchClientVisitPhotoUrl(visitId, kind)
      .then((u) => {
        created = u;
        if (!cancelled) setUrl(u);
        else URL.revokeObjectURL(u);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [visitId, kind]);

  return (
    <div className="space-y-1">
      <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wide">{label}</div>
      <button
        type="button"
        disabled={!url}
        onClick={() => url && window.open(url, '_blank', 'noopener')}
        className="relative block w-full aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center"
        title="Bada dekhne ke liye click karo"
      >
        {url ? (
          <img src={url} alt={label} className="absolute inset-0 w-full h-full object-cover" />
        ) : failed ? (
          <ImageOff className="w-5 h-5 text-slate-300" />
        ) : (
          <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
        )}
      </button>
    </div>
  );
}
