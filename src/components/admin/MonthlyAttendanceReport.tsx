import { useEffect, useMemo, useRef, useState } from 'react';
import { Employee, MonthlySummaryRow, Office } from '../../types';
import { getAttendanceSummaryApi } from '../../lib/api';
import { useLiveEvents } from '../../lib/realtime';
import { Avatar } from './Avatar';
import { Search, CalendarDays, ChevronRight } from 'lucide-react';

interface MonthlyAttendanceReportProps {
  employees: Employee[];
  offices: Office[];
  onOpenEmployee: (employeeId: string) => void;
}

export function currentMonthIST() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' }).slice(0, 7);
}

const fmtNum = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
const fmtHours = (m: number) => `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;

// Mahine ka hisaab: kitne din aaya, late, half day, on leave, absent, total hours
// (sab server se, working hours ke hisaab se)
export function MonthlyAttendanceReport({ employees, offices, onOpenEmployee }: MonthlyAttendanceReportProps) {
  const [month, setMonth] = useState(currentMonthIST());
  const [summary, setSummary] = useState<MonthlySummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const monthRef = useRef(month);
  monthRef.current = month;

  const load = (m: string, quiet = false) => {
    if (!m) return;
    if (!quiet) setLoading(true);
    setError(null);
    getAttendanceSummaryApi(m)
      .then((d) => {
        if (monthRef.current === m) setSummary(d);
      })
      .catch((err) => {
        if (monthRef.current === m) {
          setSummary([]);
          setError(err instanceof Error ? err.message : 'Data load nahi ho paaya');
        }
      })
      .finally(() => {
        if (monthRef.current === m) setLoading(false);
      });
  };

  useEffect(() => {
    load(month);
  }, [month]);

  // Chalu mahine me koi aaya / late hua to hisaab turant naya ho
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useLiveEvents('admin', true, (event) => {
    if ((event === 'attendance' || event === 'reconnected') && monthRef.current === currentMonthIST()) {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => load(monthRef.current, true), 1500);
    }
  });

  const rows = useMemo(() => {
    const byEmp = new Map(summary.map((r) => [r.employeeId, r]));
    const q = search.trim().toLowerCase();
    return employees
      .map((emp) => ({
        emp,
        s: byEmp.get(emp.id) || { employeeId: emp.id, came: 0, late: 0, half: 0, absent: 0, leave: 0, minutes: 0, outMinutes: 0 },
      }))
      .filter(
        ({ emp }) =>
          !q || emp.fullName.toLowerCase().includes(q) || emp.empId.toLowerCase().includes(q) || emp.department.toLowerCase().includes(q)
      )
      .sort((a, b) => b.s.came - a.s.came || a.emp.fullName.localeCompare(b.emp.fullName));
  }, [employees, summary, search]);

  const monthLabel = month ? new Date(`${month}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Monthly Attendance (महीने की उपस्थिति)</h3>
          <p className="text-xs text-slate-500">
            {monthLabel || 'Is mahine'}: kaun kitne din aaya, kitni baar late, half day, leave aur absent. Attendance sirf working hours me lagti hai.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-indigo-600" />
          <input
            type="month"
            value={month}
            max={currentMonthIST()}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search by name, ID or department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {error && <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">{error}</div>}

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <th className="py-3 px-4">Employee</th>
              <th className="py-3 px-4">Department & Base</th>
              <th className="py-3 px-4 text-center">Din Aaya</th>
              <th className="py-3 px-4 text-center">Late</th>
              <th className="py-3 px-4 text-center">Half Day</th>
              <th className="py-3 px-4 text-center">On Leave</th>
              <th className="py-3 px-4 text-center">Absent</th>
              <th className="py-3 px-4">Total Hours</th>
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500">
                  Koi employee nahi mila.
                </td>
              </tr>
            ) : (
              rows.map(({ emp, s }) => {
                const office = offices.find((o) => o.id === emp.officeId);
                return (
                  <tr
                    key={emp.id}
                    onClick={() => onOpenEmployee(emp.id)}
                    className={`hover:bg-slate-50 transition-colors cursor-pointer ${emp.status === 'INACTIVE' ? 'opacity-60' : ''}`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar src={emp.avatar} name={emp.fullName} className="w-8 h-8 rounded-full border border-slate-300 object-cover" />
                        <div>
                          <div className="font-semibold text-slate-900">{emp.fullName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{emp.empId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-900 font-medium">{emp.department}</div>
                      <div className="text-[10px] text-slate-500">{office?.name || emp.branch}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block min-w-[2.25rem] px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-extrabold text-sm">
                        {s.came}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-mono font-bold ${s.late > 0 ? 'text-amber-600' : 'text-slate-400'}`}>{s.late}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-semibold text-orange-600">{s.half}</td>
                    <td className="py-3 px-4 text-center font-mono font-semibold text-purple-600">{fmtNum(s.leave)}</td>
                    <td className="py-3 px-4 text-center font-mono font-semibold text-rose-600">{s.absent}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{fmtHours(s.minutes)}</td>
                    <td className="py-3 px-4 text-right text-slate-400">
                      <ChevronRight className="w-4 h-4 inline" />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="text-[10px] text-slate-400">
        Din Aaya me half day wale din bhi ginte hain. Late = shift start + grace ke baad aaye. On Leave = approved leave ke din (weekly off chhod kar).
      </div>
    </div>
  );
}
