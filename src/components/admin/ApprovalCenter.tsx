import { useState } from 'react';
import { LeaveRequest, RegularizationRequest, ExpenseClaim } from '../../types';
import { Check, X, Calendar, Clock, Receipt, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatINR } from '../../utils/payroll';

interface ApprovalCenterProps {
  leaves: LeaveRequest[];
  regularizations: RegularizationRequest[];
  expenses: ExpenseClaim[];
  onActionLeave: (id: string, action: 'APPROVED' | 'REJECTED') => void;
  onActionRegularization: (id: string, action: 'APPROVED' | 'REJECTED') => void;
  onActionExpense: (id: string, action: 'APPROVED' | 'REJECTED') => void;
}

export function ApprovalCenter({
  leaves,
  regularizations,
  expenses,
  onActionLeave,
  onActionRegularization,
  onActionExpense,
}: ApprovalCenterProps) {
  const [activeTab, setActiveTab] = useState<'leaves' | 'reg' | 'expenses'>('leaves');

  const pendingLeaves = leaves.filter((l) => l.status === 'PENDING');
  const pendingRegs = regularizations.filter((r) => r.status === 'PENDING');
  const pendingExpenses = expenses.filter((e) => e.status === 'PENDING');

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl space-y-4 p-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Central Approval Inbox</h3>
          <p className="text-xs text-slate-500">
            Manager & HR unified approval workflow for leaves, attendance regularizations, and expense claims
          </p>
        </div>

        {/* Tab Badges */}
        <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('leaves')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'leaves' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Leaves ({pendingLeaves.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('reg')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'reg' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Regularizations ({pendingRegs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'expenses'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Expenses ({pendingExpenses.length})</span>
          </button>
        </div>
      </div>

      {/* Main Approval Cards */}
      <div className="space-y-3 pt-1">
        {/* LEAVES TAB */}
        {activeTab === 'leaves' && (
          <div className="space-y-3">
            {pendingLeaves.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs">
                ✓ All leave applications have been reviewed. No pending approvals in queue.
              </div>
            ) : (
              pendingLeaves.map((l) => (
                <div
                  key={l.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1.5 flex-1 min-w-[260px]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{l.employeeName}</span>
                      <span className="bg-indigo-50 text-indigo-600 border border-indigo-200 px-2 py-0.5 rounded text-[10px] font-mono">
                        {l.leaveType} LEAVE · {l.daysCount} DAY(S)
                      </span>
                    </div>
                    <div className="text-slate-500">
                      Period: <span className="text-slate-900 font-medium">{l.startDate} to {l.endDate}</span> {l.isHalfDay && '(Half Day)'}
                    </div>
                    <p className="text-slate-700 italic bg-slate-50 p-2 rounded-lg border border-slate-200">
                      "{l.reason}"
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onActionLeave(l.id, 'APPROVED')}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/20"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve Leave</span>
                    </button>
                    <button
                      onClick={() => onActionLeave(l.id, 'REJECTED')}
                      className="px-3 py-2 bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-800 border border-slate-200 rounded-xl flex items-center gap-1.5 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* REGULARIZATIONS TAB */}
        {activeTab === 'reg' && (
          <div className="space-y-3">
            {pendingRegs.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs">
                ✓ All attendance correction requests have been settled.
              </div>
            ) : (
              pendingRegs.map((r) => (
                <div
                  key={r.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1.5 flex-1 min-w-[260px]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{r.employeeName}</span>
                      <span className="bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-mono">
                        PUNCH CORRECTION
                      </span>
                    </div>
                    <div className="text-slate-500">
                      Target Date: <span className="text-slate-900 font-medium">{r.date}</span> | Requested Hours:{' '}
                      <span className="font-mono text-cyan-600">{r.requestedCheckIn} – {r.requestedCheckOut}</span>
                    </div>
                    <p className="text-slate-700 italic bg-slate-50 p-2 rounded-lg border border-slate-200">
                      "{r.reason}"
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onActionRegularization(r.id, 'APPROVED')}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/20"
                    >
                      <Check className="w-4 h-4" />
                      <span>Accept Correction</span>
                    </button>
                    <button
                      onClick={() => onActionRegularization(r.id, 'REJECTED')}
                      className="px-3 py-2 bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-800 border border-slate-200 rounded-xl flex items-center gap-1.5 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* EXPENSES TAB */}
        {activeTab === 'expenses' && (
          <div className="space-y-3">
            {pendingExpenses.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs">
                ✓ All expense claims processed.
              </div>
            ) : (
              pendingExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1.5 flex-1 min-w-[260px]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{exp.employeeName}</span>
                      <span className="font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-xs">
                        {formatINR(exp.amount)}
                      </span>
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px]">
                        {exp.category}
                      </span>
                    </div>
                    <div className="text-slate-500">Date: {exp.date} · Receipt: <span className="underline text-indigo-600">{exp.receiptName}</span></div>
                    <p className="text-slate-700 italic bg-slate-50 p-2 rounded-lg border border-slate-200">
                      "{exp.description}"
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onActionExpense(exp.id, 'APPROVED')}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/20"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve Claim</span>
                    </button>
                    <button
                      onClick={() => onActionExpense(exp.id, 'REJECTED')}
                      className="px-3 py-2 bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-800 border border-slate-200 rounded-xl flex items-center gap-1.5 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
