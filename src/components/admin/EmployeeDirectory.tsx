import { useEffect, useMemo, useRef, useState } from 'react';
import { Employee, AttendanceRecord, Office, Shift } from '../../types';
import { DeactivateEmployeeModal } from './DeactivateEmployeeModal';
import { DeleteEmployeeModal } from './DeleteEmployeeModal';
import { TransferEmployeeModal } from './TransferEmployeeModal';
import { EmployeeDocuments } from './EmployeeDocuments';
import { LeaveBalanceCard } from './LeaveBalanceCard';
import { FieldVisitList } from './FieldVisitList';
import { SalarySlipsCard } from './SalarySlipsCard';
import { getEmployeeAttendanceApi } from '../../lib/api';
import { formatINR } from '../../utils/payroll';
import { didCome, currentMonthIST } from './MonthlyAttendanceReport';
import {
  Search,
  UserSearch,
  Briefcase,
  Building,
  CalendarCheck,
  IndianRupee,
  FileText,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  MapPin,
  UserCog,
  Clock,
  UserX,
  UserCheck,
  Eye,
  Trash2,
  ArrowRightLeft,
  GraduationCap,
  CalendarDays,
  History,
  Route,
  Receipt,
} from 'lucide-react';

interface EmployeeDirectoryProps {
  employees: Employee[];
  offices: Office[];
  shifts: Shift[];
  initialEmployeeId?: string | null;
  attendanceRecords: AttendanceRecord[];
  onToggleEmployeeStatus: (employeeId: string, newStatus: 'ACTIVE' | 'INACTIVE', reason?: string) => void;
  onDeleteEmployee: (employeeId: string, confirmEmpId: string) => Promise<void>;
  onViewAudit: (employee: Employee, record?: AttendanceRecord) => void;
  onTransferEmployee: (
    employeeId: string,
    payload: { officeId: string; shiftId?: string; reportingManager?: string; reason?: string }
  ) => Promise<void>;
}

const daysAgo = (n: number) => {
  const d = new Date(`${todayStr()}T00:00:00`);
  d.setDate(d.getDate() - n);
  return d.toLocaleDateString('en-CA');
};
const todayStr = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

function formatDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function tenure(iso: string) {
  const start = new Date(`${(iso || '').slice(0, 10)}T00:00:00`);
  if (isNaN(start.getTime())) return '';
  const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) months -= 1;
  if (months < 0) return '';
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0 && m === 0) return 'Is mahine join kiya';
  return [y ? `${y} saal` : '', m ? `${m} mahine` : ''].filter(Boolean).join(' ');
}

function Field({ label, value, mono }: { label: string; value?: string | number | null; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">{label}</div>
      <div className={`text-xs text-slate-900 font-semibold break-words ${mono ? 'font-mono' : ''}`}>
        {value || value === 0 ? value : '—'}
      </div>
    </div>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon: typeof Clock; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-2">
        <Icon className="w-4 h-4 text-indigo-600" />
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
}

export function EmployeeDirectory({
  employees,
  offices,
  shifts,
  initialEmployeeId,
  attendanceRecords,
  onToggleEmployeeStatus,
  onDeleteEmployee,
  onViewAudit,
  onTransferEmployee,
}: EmployeeDirectoryProps) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(initialEmployeeId || null);
  const [showList, setShowList] = useState(false);
  const [history, setHistory] = useState<AttendanceRecord[] | null>(null);
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Monthly report se kisi employee par click karke aaye to wahi khul jaye
  useEffect(() => {
    if (initialEmployeeId) setSelectedId(initialEmployeeId);
  }, [initialEmployeeId]);

  // Bahar click karne par suggestions band
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setShowList(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const employee = employees.find((e) => e.id === selectedId) || null;

  // Selected employee ki attendance history (is mahine ka summary ke liye)
  useEffect(() => {
    if (!employee) {
      setHistory(null);
      return;
    }
    let cancelled = false;
    setHistory(null);
    getEmployeeAttendanceApi(employee.id)
      .then((d) => {
        if (!cancelled) setHistory(d);
      })
      .catch(() => {
        if (!cancelled) setHistory([]);
      });
    return () => {
      cancelled = true;
    };
  }, [employee?.id]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return employees
      .filter(
        (e) =>
          e.fullName.toLowerCase().includes(q) ||
          e.empId.toLowerCase().includes(q) ||
          e.designation.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [employees, query]);

  const monthStats = useMemo(() => {
    const month = currentMonthIST();
    const list = (history || []).filter((r) => r.date.startsWith(month));
    return {
      came: list.filter(didCome).length,
      absent: list.filter((r) => r.status === 'ABSENT').length,
      leave: list.filter((r) => r.status === 'ON_LEAVE').length,
      late: list.filter((r) => r.isLate).length,
    };
  }, [history]);

  const office = employee ? offices.find((o) => o.id === employee.officeId) : undefined;
  const shift = employee ? shifts.find((s) => s.id === employee.shiftId) : undefined;
  const grossMonthly = employee
    ? (employee.basicMonthly || 0) + (employee.hraMonthly || 0) + (employee.specialAllowanceMonthly || 0)
    : 0;

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xl space-y-3">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Employee Details (कर्मचारी की जानकारी)</h3>
          <p className="text-xs text-slate-500">Naam likho, list me employee dikhega — click karte hi uski poori detail khul jayegi</p>
        </div>

        <div ref={boxRef} className="relative max-w-xl">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={query}
            placeholder="Employee ka naam, ID ya post likho..."
            onChange={(e) => {
              setQuery(e.target.value);
              setShowList(true);
            }}
            onFocus={() => setShowList(true)}
            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />

          {showList && query.trim() && (
            <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
              {matches.length === 0 ? (
                <div className="px-4 py-3 text-xs text-slate-500">Is naam ka koi employee nahi mila</div>
              ) : (
                matches.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => {
                      setSelectedId(e.id);
                      setQuery(e.fullName);
                      setShowList(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-indigo-50 transition-colors border-b border-slate-100 last:border-0"
                  >
                    <img
                      src={e.avatar}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full border border-slate-300 object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate">{e.fullName}</div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {e.empId} · {e.designation}
                      </div>
                    </div>
                    {e.status === 'INACTIVE' && (
                      <span className="text-[10px] text-rose-600 bg-rose-50 border border-rose-200 px-1.5 rounded">Inactive</span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Empty state */}
      {!employee && (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl py-16 text-center text-slate-500 space-y-2">
          <UserSearch className="w-8 h-8 mx-auto text-slate-300" />
          <div className="text-xs">Upar search karke koi employee chuniye</div>
        </div>
      )}

      {/* Detail */}
      {employee && (
        <div className="space-y-4">
          {/* Profile header */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-wrap items-center gap-4">
            <img
              src={employee.avatar}
              alt={employee.fullName}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-2xl border border-slate-300 object-cover"
            />
            <div className="flex-1 min-w-[200px]">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-lg font-extrabold text-slate-900">{employee.fullName}</h4>
                {employee.status === 'INACTIVE' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    Inactive
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                <span className="font-mono">{employee.empId}</span> · {employee.designation}
              </div>
              {employee.status === 'INACTIVE' && employee.deactivationReason && (
                <div className="text-[11px] text-rose-600 mt-1">Reason: {employee.deactivationReason}</div>
              )}
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Joined</div>
              <div className="text-sm font-bold text-slate-900">{formatDate(employee.joiningDate)}</div>
              <div className="text-[11px] text-slate-500">{tenure(employee.joiningDate)}</div>
            </div>
          </div>

          {/* App Access (आईडी स्थिति) — Roster wale options ab yahin bhi */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">App Access (आईडी स्थिति)</div>
              {employee.status === 'INACTIVE' ? (
                <>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-mono text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <UserX className="w-3.5 h-3.5" /> निष्क्रिय (Blocked)
                  </span>
                  <div className="text-[11px] text-rose-600">{employee.deactivationReason || 'Left Company'}</div>
                </>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-mono text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> सक्रिय (Active)
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {employee.status === 'INACTIVE' ? (
                <button
                  onClick={() => setShowDeactivate(true)}
                  className="px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5" /> पुनः सक्रिय करें
                </button>
              ) : (
                <button
                  onClick={() => setShowDeactivate(true)}
                  title="कंपनी छोड़ने पर आईडी डिएक्टिवेट करें ताकि लॉगिन बंद हो"
                  className="px-3 py-2 text-xs font-semibold text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <UserX className="w-3.5 h-3.5" /> आईडी डीएक्टिवेट करें
                </button>
              )}
              <button
                onClick={() => setShowTransfer(true)}
                disabled={employee.status === 'INACTIVE'}
                className="px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-40"
                title="Doosre branch me transfer karo"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer
              </button>
              <button
                onClick={() => onViewAudit(employee, attendanceRecords.find((a) => a.employeeId === employee.id))}
                className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-1.5 transition-colors"
                title="View Audit Trail"
              >
                <Eye className="w-3.5 h-3.5" /> Audit Trail
              </button>
              <button
                onClick={() => setShowDelete(true)}
                className="px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl flex items-center gap-1.5 transition-colors"
                title="Employee ki poori profile delete karo"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Post & Branch */}
            <Card title="Post & Branch (पद और शाखा)" icon={Briefcase}>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Post / Designation" value={employee.designation} />
                <Field label="Department" value={employee.department} />
                <Field label="Branch" value={office?.name || employee.branch} />
                <Field label="City" value={office?.city || employee.branch} />
                <Field
                  label="Employment Type"
                  value={employee.employmentType?.replace('_', ' ')}
                />
                <Field label="Work Type" value={employee.workType === 'FIELD_WORK' ? 'Field Work' : 'In-Office'} />
                <Field label="Reporting Manager" value={employee.reportingManager} />
                <Field label="Shift" value={shift ? `${shift.name} (${shift.startTime} – ${shift.endTime})` : ''} />
              </div>
              {office?.address && (
                <div className="flex items-start gap-1.5 text-[11px] text-slate-500 pt-1">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
                  <span>{office.address}</span>
                </div>
              )}
            </Card>

            {/* Salary */}
            <Card title="Salary (वेतन)" icon={IndianRupee}>
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-indigo-400">Monthly Gross</div>
                  <div className="text-xl font-extrabold text-indigo-700 font-mono">{formatINR(grossMonthly)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-indigo-400">Annual CTC</div>
                  <div className="text-sm font-bold text-indigo-700 font-mono">{formatINR(employee.ctcAnnual || 0)}</div>
                </div>
              </div>
              {employee.workMode === 'TRAINING' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1 text-[11px]">
                  <div className="font-bold text-amber-800">
                    {(employee.trainingEndDate || '') >= todayStr()
                      ? 'Abhi Training Period me hai'
                      : 'Training pura ho chuka hai'}
                  </div>
                  <div className="text-amber-800">
                    {employee.trainingMonths} mahine · Training salary{' '}
                    <span className="font-mono font-bold">{formatINR(employee.trainingStipendMonthly || 0)}</span>/mahina · khatam{' '}
                    <span className="font-mono font-bold">{formatDate(employee.trainingEndDate || '')}</span>
                  </div>
                  <div className="text-amber-700">Upar wali salary training ke <strong>baad</strong> ki hai.</div>
                </div>
              )}
              {employee.workMode === 'DIRECT' && (
                <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5">
                  Direct Working par joined (training nahi)
                </div>
              )}
              <div className="grid grid-cols-3 gap-3">
                <Field label="Basic" value={formatINR(employee.basicMonthly || 0)} mono />
                <Field label="HRA" value={formatINR(employee.hraMonthly || 0)} mono />
                <Field label="Special Allow." value={formatINR(employee.specialAllowanceMonthly || 0)} mono />
              </div>
            </Card>

            {/* Documents (database me save) */}
            <div className="lg:col-span-2">
              <Card title="Documents (दस्तावेज़) — Aadhaar, PAN, Bank, Education" icon={FileText}>
                <EmployeeDocuments employee={employee} />
              </Card>
            </div>

            {/* Salary slips (admin upload karta hai, employee ke app me tabhi dikhti hai) */}
            <div className="lg:col-span-2">
              <Card title="Salary Slips (वेतन पर्ची) — upload karo, employee app me dikhegi" icon={Receipt}>
                <SalarySlipsCard employee={employee} />
              </Card>
            </div>

            {/* Education */}
            <Card title="Education (पढ़ाई)" icon={GraduationCap}>
              {employee.education && employee.education.length > 0 ? (
                <div className="space-y-2">
                  {employee.education.map((e, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                      <div className="text-xs font-semibold text-slate-900">{e.degree || '—'}</div>
                      <div className="text-[11px] text-slate-500">
                        {e.institute || '—'}
                        {e.year && ` · ${e.year}`}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500">Padhai ki details add nahi hui</div>
              )}
            </Card>

            {/* Leave balance */}
            <Card title="Leave Balance (बची हुई छुट्टी)" icon={CalendarDays}>
              <LeaveBalanceCard employeeId={employee.id} />
            </Card>

            {/* Field visits (sirf field work wale employee ke liye) */}
            {employee.workType === 'FIELD_WORK' && (
              <div className="lg:col-span-2">
                <Card title="Field Visits (pichhle 30 din)" icon={Route}>
                  <FieldVisitList
                    filter={{ employeeId: employee.id, from: daysAgo(30), to: todayStr() }}
                    showEmployee={false}
                  />
                </Card>
              </div>
            )}

            {/* Transfer history */}
            {employee.transferHistory && employee.transferHistory.length > 0 && (
              <div className="lg:col-span-2">
                <Card title="Transfer History" icon={History}>
                  <div className="space-y-2">
                    {[...employee.transferHistory].reverse().map((t, i) => (
                      <div key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
                        <span className="font-mono text-slate-500">{formatDate(t.date)}</span>
                        <span className="font-semibold text-slate-900">
                          {t.fromOfficeName || '—'} → <span className="text-indigo-700">{t.toOfficeName}</span>
                        </span>
                        {t.reason && <span className="text-slate-500">· {t.reason}</span>}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* Contact + this month */}
            <div className="space-y-4">
              <Card title="Contact (संपर्क)" icon={UserCog}>
                <div className="space-y-1.5 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {employee.phone || '—'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {employee.email || '—'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-slate-400" /> App Login ID:{' '}
                    <span className="font-mono font-semibold">{employee.loginId || employee.empId}</span>
                  </div>
                </div>
              </Card>

              <Card title="Is mahine ki attendance" icon={CalendarCheck}>
                {history === null ? (
                  <div className="text-xs text-slate-500">Loading…</div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { label: 'Aaya', value: monthStats.came, color: 'text-emerald-600' },
                      { label: 'Absent', value: monthStats.absent, color: 'text-rose-600' },
                      { label: 'Leave', value: monthStats.leave, color: 'text-purple-600' },
                      { label: 'Late', value: monthStats.late, color: 'text-amber-600' },
                    ].map((s) => (
                      <div key={s.label} className="bg-slate-50 border border-slate-200 rounded-xl py-2">
                        <div className={`text-lg font-extrabold font-mono ${s.color}`}>{s.value}</div>
                        <div className="text-[10px] text-slate-500 font-semibold">{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}
      {employee && showDeactivate && (
        <DeactivateEmployeeModal
          employee={employee}
          onConfirm={(empId, newStatus, reason) => {
            onToggleEmployeeStatus(empId, newStatus, reason);
            setShowDeactivate(false);
          }}
          onClose={() => setShowDeactivate(false)}
        />
      )}

      {employee && showTransfer && (
        <TransferEmployeeModal
          employee={employee}
          offices={offices}
          shifts={shifts}
          onTransfer={onTransferEmployee}
          onClose={() => setShowTransfer(false)}
        />
      )}

      {employee && showDelete && (
        <DeleteEmployeeModal
          employee={employee}
          onConfirm={async (empId, confirmEmpId) => {
            await onDeleteEmployee(empId, confirmEmpId);
            // Delete ho gaya: ab ye employee list me nahi, page khali kar do
            setShowDelete(false);
            setSelectedId(null);
            setQuery('');
          }}
          onClose={() => setShowDelete(false)}
        />
      )}
    </div>
  );
}
