import { useState } from 'react';
import { Employee, Office, Shift } from '../../types';
import { ArrowRightLeft, X, Loader2, ArrowRight } from 'lucide-react';

interface TransferEmployeeModalProps {
  employee: Employee;
  offices: Office[];
  shifts: Shift[];
  onTransfer: (
    employeeId: string,
    payload: { officeId: string; shiftId?: string; reportingManager?: string; reason?: string }
  ) => Promise<void>;
  onClose: () => void;
}

const inputCls =
  'w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500';

// Employee ko ek branch se doosre me bhejo: ab naye branch ke radius me attendance lagegi
export function TransferEmployeeModal({ employee, offices, shifts, onTransfer, onClose }: TransferEmployeeModalProps) {
  const current = offices.find((o) => o.id === employee.officeId);
  const options = offices.filter((o) => o.id !== employee.officeId);
  const [officeId, setOfficeId] = useState(options[0]?.id || '');
  const [shiftId, setShiftId] = useState(employee.shiftId);
  const [manager, setManager] = useState(employee.reportingManager || '');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const target = offices.find((o) => o.id === officeId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!officeId || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onTransfer(employee.id, {
        officeId,
        shiftId: shiftId !== employee.shiftId ? shiftId : undefined,
        reportingManager: manager.trim() !== (employee.reportingManager || '') ? manager.trim() : undefined,
        reason: reason.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transfer nahi ho paaya');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Branch Transfer</h3>
              <p className="text-[11px] text-slate-500">{employee.fullName} · {employee.empId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-3.5 text-xs">
          {options.length === 0 ? (
            <div className="text-slate-600">Transfer ke liye koi doosra office nahi hai. Pehle Office Locations me naya branch jodo.</div>
          ) : (
            <>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Abhi</div>
                  <div className="font-semibold text-slate-900 truncate">{current?.name || employee.branch}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-indigo-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Naya</div>
                  <div className="font-semibold text-indigo-700 truncate">{target?.name || '—'}</div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Naya Branch / Office *</label>
                <select value={officeId} onChange={(e) => setOfficeId(e.target.value)} className={inputCls}>
                  {options.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Shift</label>
                  <select value={shiftId} onChange={(e) => setShiftId(e.target.value)} className={inputCls}>
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Reporting Manager</label>
                  <input type="text" value={manager} onChange={(e) => setManager(e.target.value)} className={inputCls} />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Transfer ka karan (optional)</label>
                <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Naye branch me staff ki zaroorat" className={inputCls} />
              </div>

              <div className="text-[11px] text-slate-500 bg-indigo-50 border border-indigo-100 rounded-xl p-2.5 leading-relaxed">
                Transfer ke baad employee ki attendance <strong>naye branch ke radius</strong> me hi lagegi aur wo naye branch ki list me dikhega. Purani attendance purane branch ke naam par hi rahegi.
              </div>
            </>
          )}

          {error && <div className="text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5">{error}</div>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium">
              Cancel
            </button>
            {options.length > 0 && (
              <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />}
                <span>{saving ? 'Transfer ho raha hai…' : 'Transfer Karo'}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
