import { useEffect, useState } from 'react';
import { LeaveBalance, LeaveKind } from '../../types';
import { getEmployeeLeaveBalanceApi } from '../../lib/api';

const KINDS: { k: LeaveKind; label: string; bar: string }[] = [
  { k: 'CASUAL', label: 'Casual', bar: 'bg-emerald-500' },
  { k: 'SICK', label: 'Sick', bar: 'bg-rose-500' },
  { k: 'EARNED', label: 'Earned', bar: 'bg-indigo-500' },
];

// Fix leave me se kitni bachi: quota - li hui - pending
export function LeaveBalanceCard({ employeeId }: { employeeId: string }) {
  const [data, setData] = useState<LeaveBalance | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(false);
    getEmployeeLeaveBalanceApi(employeeId)
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  if (error) return <div className="text-xs text-slate-500">Leave balance load nahi hua (server update karna padega).</div>;
  if (!data) return <div className="text-xs text-slate-500">Loading…</div>;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {KINDS.map(({ k, label, bar }) => {
          const b = data.balances[k];
          const pct = b.total > 0 ? Math.max(0, Math.min(100, (b.remaining / b.total) * 100)) : 0;
          return (
            <div key={k} className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1.5">
              <div className="text-[10px] font-bold text-slate-500 uppercase">{label}</div>
              <div className="text-xl font-extrabold font-mono text-slate-900">
                {b.remaining}
                <span className="text-[11px] font-semibold text-slate-400"> / {b.total}</span>
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className={`h-full ${bar}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="text-[10px] text-slate-500">
                Li: {b.used}
                {b.pending > 0 && ` · Pending: ${b.pending}`}
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-[10px] text-slate-400">Saal {data.year} · bachi hui = quota − approved − pending</div>
    </div>
  );
}
