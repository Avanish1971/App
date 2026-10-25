import { useState } from 'react';
import { LeaveRequest, LeaveBalance, LeaveKind } from '../../types';
import { Calendar, Plus, CheckCircle, Clock, X, AlertCircle } from 'lucide-react';

interface LeaveModuleProps {
  leaves: LeaveRequest[];
  leaveBalance: LeaveBalance | null;
  employeeId: string;
  employeeName: string;
  // Server mana kare (jaise leave kam hai) to error throw hota hai
  onApplyLeave: (newLeave: Omit<LeaveRequest, 'id' | 'appliedAt' | 'status'>) => Promise<void>;
  onClose: () => void;
}

const todayStr = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

const KIND_INFO: Record<LeaveKind, { short: string; full: string; box: string; text: string }> = {
  CASUAL: { short: 'Casual Leave (CL)', full: 'Casual Leave (CL)', box: 'bg-blue-50 border-blue-100', text: 'text-blue-600' },
  SICK: { short: 'Sick Leave (SL)', full: 'Sick / Medical Leave (SL)', box: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-600' },
  EARNED: { short: 'Earned Leave (EL)', full: 'Earned / Privilege Leave (EL)', box: 'bg-violet-50 border-violet-100', text: 'text-violet-600' },
};
const KINDS = Object.keys(KIND_INFO) as LeaveKind[];

export function LeaveModule({ leaves, leaveBalance, employeeId, employeeName, onApplyLeave, onClose }: LeaveModuleProps) {
  const [activeTab, setActiveTab] = useState<'balance' | 'apply' | 'history'>('balance');
  const [leaveType, setLeaveType] = useState<LeaveKind>('CASUAL');
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState(todayStr());
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Server se aaya asli balance: bachi hui = quota - li hui - pending
  const left = (k: LeaveKind) => leaveBalance?.balances[k]?.remaining;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || busy || submitted) return;
    setError(null);
    setBusy(true);
    try {
      await onApplyLeave({
        employeeId,
        employeeName,
        leaveType,
        startDate,
        endDate: isHalfDay ? startDate : endDate,
        daysCount: isHalfDay ? 0.5 : 1, // asli din server ginta hai
        isHalfDay,
        reason,
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setActiveTab('balance');
        setReason('');
      }, 1400);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Leave apply nahi ho paayi');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-500 to-teal-500">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-white/25 text-white flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Leave Management</h3>
              <p className="text-[11px] text-emerald-50">Apply leaves & check available quotas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/20"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-1 border-b border-emerald-100 bg-emerald-50 p-1.5 text-xs">
          <button
            onClick={() => setActiveTab('balance')}
            className={`flex-1 py-2 font-medium rounded-lg transition-colors ${
              activeTab === 'balance'
                ? 'bg-white text-emerald-700 font-semibold shadow-sm'
                : 'text-emerald-700/70 hover:text-emerald-800'
            }`}
          >
            Leave Balances
          </button>
          <button
            onClick={() => setActiveTab('apply')}
            className={`flex-1 py-2 font-medium rounded-lg transition-colors ${
              activeTab === 'apply'
                ? 'bg-white text-emerald-700 font-semibold shadow-sm'
                : 'text-emerald-700/70 hover:text-emerald-800'
            }`}
          >
            + Apply Leave
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 font-medium rounded-lg transition-colors ${
              activeTab === 'history'
                ? 'bg-white text-emerald-700 font-semibold shadow-sm'
                : 'text-emerald-700/70 hover:text-emerald-800'
            }`}
          >
            My Requests
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {activeTab === 'balance' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                {KINDS.map((k) => {
                  const b = leaveBalance?.balances[k];
                  const info = KIND_INFO[k];
                  return (
                    <div key={k} className={`${info.box} border rounded-xl p-3 space-y-1`}>
                      <div className={`text-[10px] font-semibold uppercase ${info.text}`}>{info.short}</div>
                      <div className="text-2xl font-bold text-slate-900 font-mono">{b ? b.remaining : '—'}</div>
                      <div className="text-[10px] text-slate-500">
                        {b ? `${b.remaining} bachi / ${b.total} total` : 'Loading…'}
                      </div>
                      {b && (b.used > 0 || b.pending > 0) && (
                        <div className="text-[10px] text-slate-500">
                          Li: {b.used}
                          {b.pending > 0 && ` · Pending: ${b.pending}`}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 text-xs text-slate-600 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Leave apply karte hi bachi hui leave me se kam ho jaati hai. Reject hone par wapas mil jaati hai. Quota khatam hone par leave apply nahi hogi.
                </span>
              </div>

              <button
                onClick={() => setActiveTab('apply')}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/30"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Apply for Leave Now</span>
              </button>
            </div>
          )}

          {activeTab === 'apply' && (
            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Leave Category</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as LeaveKind)}
                  className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                >
                  {KINDS.map((k) => (
                    <option key={k} value={k}>
                      {KIND_INFO[k].full} - {left(k) ?? '—'} Remaining
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">From Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (endDate < e.target.value) setEndDate(e.target.value);
                    }}
                    className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">To Date</label>
                  <input
                    type="date"
                    value={isHalfDay ? startDate : endDate}
                    disabled={isHalfDay}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="halfDay"
                  checked={isHalfDay}
                  onChange={(e) => setIsHalfDay(e.target.checked)}
                  className="rounded border-emerald-300 bg-white text-emerald-600 focus:ring-0"
                />
                <label htmlFor="halfDay" className="text-slate-700">
                  Half-day leave (First or second half shift)
                </label>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Reason for Leave</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please state specific reason for manager review..."
                  rows={3}
                  className="w-full bg-white border border-emerald-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
                  required
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-[11px]">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitted || busy}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/30"
              >
                {submitted ? <CheckCircle className="w-4 h-4 text-white" /> : <Clock className="w-4 h-4" />}
                <span>{submitted ? 'Request Submitted for Manager Approval' : busy ? 'Bhej raha hai…' : 'Submit Leave Request'}</span>
              </button>
            </form>
          )}

          {activeTab === 'history' && (
            <div className="space-y-2.5 text-xs">
              {leaves.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No leave requests found</div>
              ) : (
                leaves.map((l) => (
                  <div
                    key={l.id}
                    className="bg-white border border-slate-200 shadow-sm rounded-xl p-3.5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-slate-900">
                        {l.leaveType} Leave · {l.daysCount} Day(s)
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          l.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : l.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-600 border border-rose-200'
                            : 'bg-amber-50 text-amber-600 border border-amber-200'
                        }`}
                      >
                        {l.status}
                      </span>
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      Dates: {l.startDate} to {l.endDate}
                    </div>
                    <div className="text-slate-700 italic">"{l.reason}"</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}