import { useRef, useState } from 'react';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { compressAvatar } from '../../lib/image';

export interface PickedPhoto {
  base64: string;
  mime: string;
  previewUrl: string;
}

interface AvatarPickerProps {
  currentUrl?: string; // abhi ki photo (agar hai)
  picked: PickedPhoto | null;
  onPick: (p: PickedPhoto | null) => void;
  size?: number;
  busy?: boolean;
}

// Gol photo: click karo, gallery/camera se photo chuno. Beech se chaukor kat kar chhoti ho jati hai.
export function AvatarPicker({ currentUrl, picked, onPick, size = 84, busy }: AvatarPickerProps) {
  const ref = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const shown = picked?.previewUrl || currentUrl;

  return (
    <div className="flex items-center gap-3">
      <input
        ref={ref}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          setErr(null);
          setWorking(true);
          try {
            onPick(await compressAvatar(f));
          } catch (ex) {
            setErr(ex instanceof Error ? ex.message : 'Photo nahi lag paayi');
          } finally {
            setWorking(false);
          }
        }}
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={busy}
        className="relative rounded-full overflow-hidden border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50 flex items-center justify-center shrink-0 group"
        style={{ width: size, height: size }}
        title="Photo chuno"
      >
        {shown ? <img src={shown} alt="Profile" className="w-full h-full object-cover" /> : <Camera className="w-6 h-6 text-slate-300" />}
        <span className="absolute inset-0 bg-black/45 text-white text-[10px] font-semibold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {working || busy ? <Loader2 className="w-4 h-4 animate-spin" /> : shown ? 'Badlo' : 'Photo'}
        </span>
      </button>
      <div className="text-[11px] text-slate-500 space-y-1">
        <div className="font-semibold text-slate-700">Profile Photo</div>
        <div>Ye photo employee ke mobile app me bhi dikhegi</div>
        {picked && (
          <button type="button" onClick={() => onPick(null)} className="flex items-center gap-1 text-rose-600 font-semibold">
            <Trash2 className="w-3 h-3" /> Hatao
          </button>
        )}
        {err && <div className="text-rose-600">{err}</div>}
      </div>
    </div>
  );
}
