import { useEffect, useMemo, useState } from 'react';
import { Employee, AttendanceRecord, Office } from '../../types';
import { getAttendanceMonthApi } from '../../lib/api';
import { Search, CalendarDays, ChevronRight } from 'lucide-react';

interface MonthlyAttendanceReportProps {
  employees: Employee[];
  offices: Office[];
  onOpenEmployee: (employeeId: string) => void;
}

// Ye statuses "us din aaya" maane jaate hain
const CAME_STATUSES = ['PRESENT', 'ON_BREAK', 'ON_DUTY', 'CHECKED_OUT', 'HALF_DAY', 'REGULARIZED'];

export function didCome(r: AttendanceRecord) {
  return Boolean(r.checkInTime) || CAME_STATUSES.includes(r.status);
}

export function currentMonthIST() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' }).slice(0, 7);
}

export function MonthlyAttendanceReport({ employees, offices, onOpenEmployee }: MonthlyAttendanceReportProps) {
  const [month, setMonth] = useState(currentMonthIST());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!month) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getAttendanceMonthApi(month)
      .then((data) => {
        if (!cancelled) setRecords(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setRecords([]);
          setError(err instanceof Error ? err.message : 'Data load nahi ho paaya');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [month]);

  const rows = useMemo(() => {
    const byEmp = new Map<string, AttendanceRecord[]>();
    records.forEach((r) => {
      const list = byEmp.get(r.employeeId) || [];
      list.push(r);
      byEmp.set(r.employeeId, list);
    });

    return employees
      .map((emp) => {
        const list = byEmp.get(emp.id) || [];
        const came = list.filter(didCome);
        return {
          emp,
          came: came.length,
          half: list.filter((r) => r.status === 'HALF_DAY').length,
          absent: list.filter((r) => r.status === 'ABSENT').length,
          leave: list.filter((r) => r.status === 'ON_LEAVE').length,
          late: list.filter((r) => r.isLate).length,
          minutes: list.reduce((sum, r) => sum + (r.workingMinutes || 0), 0),
        };
      })
      .filter(({ emp }) => {
        const q = search.trim().toLowerCase();
        return (
          !q ||
          emp.fullName.toLowerCase().includes(q) ||
          emp.empId.toLowerCase().includes(q) ||
          emp.department.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.came - a.came || a.emp.fullName.localeCompare(b.emp.fullName));
  }, [employees, records, search]);

  const monthLabel = month
    ? new Date(`${month}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Monthly Attendance (महीने की उपस्थिति)</h3>
          <p className="text-xs text-slate-500">
            Kaun employee {monthLabel || 'is mahine'} me kitne din aaya — row par click karke poori detail dekho
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

      {error && (
        <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">
          {error}
          {/404|not found/i.test(error) && (
            <span className="block mt-1 text-rose-500">
              Lagta hai backend server naya route (/api/attendance/monthly) ke saath restart/redeploy nahi hua.
            </span>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <th className="py-3 px-4">Employee</th>
              <th className="py-3 px-4">Department & Base</th>
              <th className="py-3 px-4 text-center">Days Came (आया)</th>
              <th className="py-3 px-4 text-center">Half Day</th>
              <th className="py-3 px-4 text-center">Absent</th>
              <th className="py-3 px-4 text-center">On Leave</th>
              <th className="py-3 px-4 text-center">Late</th>
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
              rows.map(({ emp, came, half, absent, leave, late, minutes }) => {
                const office = offices.find((o) => o.id === emp.officeId);
                return (
                  <tr
                    key={emp.id}
                    onClick={() => onOpenEmployee(emp.id)}
                    className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                      emp.status === 'INACTIVE' ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={emp.avatar}
                          alt={emp.fullName}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full border border-slate-300 object-cover"
                        />
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
                        {came}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-amber-700 font-semibold">{half}</td>
                    <td className="py-3 px-4 text-center font-mono text-rose-600 font-semibold">{absent}</td>
                    <td className="py-3 px-4 text-center font-mono text-purple-600 font-semibold">{leave}</td>
                    <td className="py-3 px-4 text-center font-mono text-amber-600 font-semibold">{late}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {Math.floor(minutes / 60)}h {String(minutes % 60).padStart(2, '0')}m
                    </td>
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
    </div>
  );
}
