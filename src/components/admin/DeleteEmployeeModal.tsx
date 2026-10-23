import { useState } from 'react';
import { Employee } from '../../types';
import { X, Trash2, AlertTriangle } from 'lucide-react';

interface DeleteEmployeeModalProps {
  employee: Employee;
  onConfirm: (employeeId: string, confirmEmpId: string) => Promise<void>;
  onClose: () => void;
}

export function DeleteEmployeeModal({ employee, onConfirm, onClose }: DeleteEmployeeModalProps) {
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matches = typed.trim().toLowerCase() === employee.empId.trim().toLowerCase();

  const handleDelete = async () => {
    if (!matches || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm(employee.id, typed.trim());
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete nahi ho paaya');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-rose-500 to-red-500">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/25 text-white flex items-center justify-center">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Employee ki profile delete karo</h3>
              <p className="text-[11px] text-rose-100">Yeh kaam wapas nahi ho sakta</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/20 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Employee card */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-3">
            <img
              src={employee.avatar}
              alt={employee.fullName}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full border border-slate-300 object-cover"
            />
            <div className="min-w-0">
              <div className="font-bold text-slate-900 text-sm truncate">{employee.fullName}</div>
              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                <span>{employee.designation}</span>
                <span>•</span>
                <span className="font-mono text-blue-600">{employee.empId}</span>
              </div>
            </div>
          </div>

          {error && <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">{error}</div>}

          {/* Kya kya hatega */}
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-rose-700">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Yeh sab hamesha ke liye hat jayega:</span>
            </div>
            <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-rose-700 leading-tight">
              <li>Employee ki poori profile aur login ID / password</li>
              <li>Uska attendance ka poora record</li>
              <li>Uski leave, regularization aur expense requests</li>
            </ul>
            <p className="text-[11px] text-slate-600 pt-1">
              Sirf login band karna ho (record bacha ke rakhna ho) to Delete ki jagah <b>"आईडी डीएक्टिवेट करें"</b> use karo.
            </p>
          </div>

          {/* Confirm */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
              Confirm karne ke liye Employee ID likho: <span className="font-mono text-rose-600">{employee.empId}</span>
            </label>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={employee.empId}
              className="w-full bg-white border border-rose-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-rose-500 placeholder:text-slate-300"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!matches || busy}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-rose-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            <span>{busy ? 'Delete ho raha hai…' : 'Hamesha ke liye delete karo'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
