import { useEffect, useState } from 'react';
import { AttendanceRecord, Outing } from '../../types';
import { LogOut } from 'lucide-react';

const mins = (m: number) => (m < 1 ? '1 min se kam' : m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`);

export const openOuting = (r?: AttendanceRecord | null): Outing | null => {
  const list = r?.outings || [];
  const last = list.length ? list[list.length - 1] : null;
  return last && !last.returnedAt ? last : null;
};

// Roster me chhota tag: "ABHI BAHAR: 12 min se" ya "BAHAR GAYA: 25 min (2 baar)"
export function OutingBadge({ record }: { record?: AttendanceRecord | null }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const outings = record?.outings || [];
  if (outings.length === 0) return null;
  const open = openOuting(record);
  const done = outings.filter((o) => o.returnedAt);
  const total = record?.totalOutMinutes || 0;
  const title = outings
    .map((o) => `${o.leftTime} → ${o.returnedTime || 'abhi bahar'}${o.minutes !== undefined ? ` (${mins(o.minutes)})` : ''}`)
    .join('\n');

  if (open) {
    const live = Math.max(0, Math.round((Date.now() - new Date(open.leftAt).getTime()) / 60000));
    return (
      <span title={title} className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-300">
        <LogOut className="w-2.5 h-2.5" /> ABHI BAHAR · {open.leftTime} se ({mins(live)})
      </span>
    );
  }
  return (
    <span title={title} className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
      <LogOut className="w-2.5 h-2.5" /> BAHAR GAYA {mins(total)} · {done.length} baar
    </span>
  );
}

// Poori list: har baar kab gaya, kab aaya, kitni der
export function OutingList({ record }: { record?: AttendanceRecord | null }) {
  const outings = record?.outings || [];
  if (outings.length === 0) return <div className="text-[11px] text-slate-500">Aaj office se bahar nahi gaya</div>;
  return (
    <div className="space-y-1">
      {outings.map((o, i) => (
        <div key={i} className="flex items-center justify-between text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
          <span className="text-slate-700">
            <strong>{i + 1}.</strong> {o.leftTime} → {o.returnedTime || <span className="text-amber-700 font-semibold">abhi bahar</span>}
          </span>
          <span className="font-mono font-bold text-slate-900">{o.minutes !== undefined ? mins(o.minutes) : ''}</span>
        </div>
      ))}
      <div className="text-[11px] text-slate-500 text-right">Kul bahar: <strong>{mins(record?.totalOutMinutes || 0)}</strong></div>
    </div>
  );
}
