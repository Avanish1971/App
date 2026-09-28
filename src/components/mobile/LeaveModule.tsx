import { useState } from 'react';
import { LeaveRequest } from '../../types';
import { Calendar, Plus, CheckCircle, Clock, X, AlertCircle } from 'lucide-react';

interface LeaveModuleProps {
  leaves: LeaveRequest[];
  onApplyLeave: (newLeave: Omit<LeaveRequest, 'id' | 'appliedAt' | 'status'>) => void;
  onClose: () => void;
}

export function LeaveModule({ leaves, onApplyLeave, onClose }: LeaveModuleProps) {
  const [activeTab, setActiveTab] = useState<'balance' | 'apply' | 'history'>('balance');
  const [leaveType, setLeaveType] = useState<LeaveRequest['leaveType']>('CASUAL');
  const [startDate, setStartDate] = useState('2026-10-05');
  const [endDate, setEndDate] = useState('2026-10-06');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Balances
  const balances = {
    CASUAL: { total: 12, used: 4, remaining: 8 },
    SICK: { total: 10, used: 2, remaining: 8 },
    EARNED: { total: 15, used: 3, remaining: 12 },
    COMP_OFF: { total: 3, used: 1, remaining: 2 },
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    onApplyLeave({
      employeeId: 'emp_001',
      employeeName: 'Avanish Dhake',
      leaveType,
      startDate,
      endDate,
      daysCount: isHalfDay ? 0.5 : 2,
      isHalfDay,
      reason,
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setActiveTab('history');
      setReason('');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Leave Management</h3>
              <p className="text-[11px] text-slate-400">Apply leaves & check available quotas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 p-1 text-xs">
          <button
            onClick={() => setActiveTab('balance')}
            className={`flex-1 py-2 font-medium rounded-lg transition-colors ${
              activeTab === 'balance'
                ? 'bg-slate-800 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Leave Balances
          </button>
          <button
            onClick={() => setActiveTab('apply')}
            className={`flex-1 py-2 font-medium rounded-lg transition-colors ${
              activeTab === 'apply'
                ? 'bg-slate-800 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            + Apply Leave
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 font-medium rounded-lg transition-colors ${
              activeTab === 'history'
                ? 'bg-slate-800 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            My Requests
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {activeTab === 'balance' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-3.5 space-y-1">
                  <div className="text-[11px] font-semibold text-indigo-400 uppercase">Casual Leave (CL)</div>
                  <div className="text-2xl font-bold text-white font-mono">{balances.CASUAL.remaining}</div>
                  <div className="text-[10px] text-slate-400">Used {balances.CASUAL.used} of {balances.CASUAL.total} days</div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-3.5 space-y-1">
                  <div className="text-[11px] font-semibold text-emerald-400 uppercase">Sick Leave (SL)</div>
                  <div className="text-2xl font-bold text-white font-mono">{balances.SICK.remaining}</div>
                  <div className="text-[10px] text-slate-400">Used {balances.SICK.used} of {balances.SICK.total} days</div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-3.5 space-y-1">
                  <div className="text-[11px] font-semibold text-cyan-400 uppercase">Earned Leave (EL)</div>
                  <div className="text-2xl font-bold text-white font-mono">{balances.EARNED.remaining}</div>
                  <div className="text-[10px] text-slate-400">Used {balances.EARNED.used} of {balances.EARNED.total} days</div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-3.5 space-y-1">
                  <div className="text-[11px] font-semibold text-amber-400 uppercase">Comp-Off</div>
                  <div className="text-2xl font-bold text-white font-mono">{balances.COMP_OFF.remaining}</div>
                  <div className="text-[10px] text-slate-400">Used {balances.COMP_OFF.used} of {balances.COMP_OFF.total} days</div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  Unapproved absences or exhaust of paid leaves automatically result in Loss of Pay (LOP) adjustments in the monthly payroll run.
                </span>
              </div>

              <button
                onClick={() => setActiveTab('apply')}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Apply for Leave Now</span>
              </button>
            </div>
          )}

          {activeTab === 'apply' && (
            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Leave Category</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="CASUAL">Casual Leave (CL) - 8 Remaining</option>
                  <option value="SICK">Sick / Medical Leave (SL) - 8 Remaining</option>
                  <option value="EARNED">Earned / Privilege Leave (EL) - 12 Remaining</option>
                  <option value="COMP_OFF">Compensatory Off (Comp-Off) - 2 Remaining</option>
                  <option value="UNPAID">Leave Without Pay (LWP / LOP)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">From Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">To Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
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
                  className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="halfDay" className="text-slate-300">
                  Half-day leave (First or second half shift)
                </label>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Reason for Leave</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please state specific reason for manager review..."
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitted}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30"
              >
                {submitted ? <CheckCircle className="w-4 h-4 text-emerald-300" /> : <Clock className="w-4 h-4" />}
                <span>{submitted ? 'Request Submitted for Manager Approval' : 'Submit Leave Request'}</span>
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
                    className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3.5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-white">
                        {l.leaveType} Leave · {l.daysCount} Day(s)
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          l.status === 'APPROVED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : l.status === 'REJECTED'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {l.status}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      Dates: {l.startDate} to {l.endDate}
                    </div>
                    <div className="text-slate-300 italic">"{l.reason}"</div>
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
