import { useState } from 'react';
import { RegularizationRequest } from '../../types';
import { Clock, CheckCircle, X, ShieldAlert } from 'lucide-react';

interface RegularizationModalProps {
  onApplyRegularization: (newReg: Omit<RegularizationRequest, 'id' | 'appliedAt' | 'status'>) => void;
  onClose: () => void;
}

export function RegularizationModal({ onApplyRegularization, onClose }: RegularizationModalProps) {
  const [date, setDate] = useState('2026-09-26');
  const [requestedCheckIn, setRequestedCheckIn] = useState('09:45 AM');
  const [requestedCheckOut, setRequestedCheckOut] = useState('06:15 PM');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    onApplyRegularization({
      employeeId: 'emp_001',
      employeeName: 'Avanish Dhake',
      date,
      requestedCheckIn,
      requestedCheckOut,
      reason,
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-violet-500 to-purple-500">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-white/25 text-white flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Attendance Regularization</h3>
              <p className="text-[11px] text-violet-100">Request correction for missed or delayed punch</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/20"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              All regularizations require direct manager approval. Provide a verifiable business justification.
            </span>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Attendance Date to Correct</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white border border-violet-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Actual In Time</label>
              <input
                type="text"
                value={requestedCheckIn}
                onChange={(e) => setRequestedCheckIn(e.target.value)}
                placeholder="e.g. 09:45 AM"
                className="w-full bg-white border border-violet-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-500 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Actual Out Time</label>
              <input
                type="text"
                value={requestedCheckOut}
                onChange={(e) => setRequestedCheckOut(e.target.value)}
                placeholder="e.g. 06:15 PM"
                className="w-full bg-white border border-violet-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-500 font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Detailed Justification</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Attended direct morning client briefing before BKC transit; or basement parking GPS attenuation."
              rows={3}
              className="w-full bg-white border border-violet-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-violet-500 placeholder:text-slate-400"
              required
            />
          </div>

          <div className="pt-1 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitted}
              className="flex-1 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white rounded-xl font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-violet-500/30"
            >
              {submitted ? <CheckCircle className="w-4 h-4 text-white" /> : <Clock className="w-4 h-4" />}
              <span>{submitted ? 'Submitted to Manager' : 'Submit Correction'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}