import { useEffect, useMemo, useRef, useState } from 'react';
import { Employee, MonthlySummaryRow, Office } from '../../types';
import { getAttendanceRangeSummaryApi, getAttendanceSummaryApi } from '../../lib/api';
import { useLiveEvents } from '../../lib/realtime';
import { Avatar } from './Avatar';
import { Search, CalendarDays, ChevronRight, X } from 'lucide-react';

interface MonthlyAttendanceReportProps {
  employees: Employee[];
  offices: Office[];
  onOpenEmployee: (employeeId: string) => void;
}

export function currentMonthIST() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' }).slice(0, 7);
}

export function todayIST() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' });
}

// 'YYYY-MM' -> us mahine ki pehli aur aakhri date (aakhri date aaj se aage nahi jaati)
function monthRange(m: string) {
  const [y, mo] = m.split('-').map(Number);
  const last = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  const end = `${m}-${String(last).padStart(2, '0')}`;
  const today = todayIST();
  return { from: `${m}-01`, to: end > today ? today : end };
}

const fmtDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const hasActivity = (rows: MonthlySummaryRow[]) => rows.some((r) => r.came || r.late || r.half || r.absent || r.leave || r.minutes);

const fmtNum = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
const fmtHours = (m: number) => `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;

// Mahine ka hisaab: kitne din aaya, late, half day, on leave, absent, total hours
// (sab server se, working hours ke hisaab se)
export function MonthlyAttendanceReport({ employees, offices, onOpenEmployee }: MonthlyAttendanceReportProps) {
  const [month, setMonth] = useState(currentMonthIST());
  // Date filter: from date -> to date (default: khali; khali ho to upar wala month dikhta hai)
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [summary, setSummary] = useState<MonthlySummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  // Chuni hui range me data na ho to us mahine ki attendance dikhate hain (kaun sa mahina, yahan)
  const [fallbackMonth, setFallbackMonth] = useState<string | null>(null);
  // Koi date chuni gayi hai ya nahi
  const dateMode = Boolean(from || to);
  // Asli range jo server se maangi jaati hai
  const monthR = monthRange(month || currentMonthIST());
  const effFrom = from || (to ? `${to.slice(0, 7)}-01` : monthR.from);
  const effTo = to || (from ? todayIST() : monthR.to);
  const rangeKey = `${effFrom}_${effTo}_${dateMode}`;
  const employeesCount = useRef(employees.length);
  employeesCount.current = employees.length;
  const rangeRef = useRef(rangeKey);
  rangeRef.current = rangeKey;
  const rangeRefValues = useRef({ effFrom, effTo, dateMode });
  rangeRefValues.current = { effFrom, effTo, dateMode };

  const load = (f: string, t: string, dm: boolean, quiet = false) => {
    if (!f || !t) return;
    const key = `${f}_${t}_${dm}`;
    if (f > t) {
      setSummary([]);
      setFallbackMonth(null);
      setLoading(false);
      setError('From date, To date se baad ki nahi ho sakti');
      return;
    }
    if (!quiet) setLoading(true);
    setError(null);
    (async () => {
      try {
        // Date nahi chuni -> seedha mahine ka hisaab (month wala purana route), date chuni -> range route
        let d = dm ? await getAttendanceRangeSummaryApi(f, t) : await getAttendanceSummaryApi(f.slice(0, 7));
        // Naya server har employee ki ek row bhejta hai. Khali list aaye to server purana hai (summary-range route nahi hai)
        if (dm && Array.isArray(d) && d.length === 0 && employeesCount.current > 0) {
          throw new Error('Server purana hai: server/server/src/routes/attendance.js update karke backend restart karo, tab date filter chalega.');
        }
        let fb: string | null = null;
        // Fallback sirf tab jab user ne khud date chuni ho aur us range me kuch na mile
        if (dm && !hasActivity(d)) {
          const m = f.slice(0, 7);
          const md = await getAttendanceSummaryApi(m);
          if (hasActivity(md)) {
            d = md;
            fb = m;
          }
        }
        if (rangeRef.current === key) {
          setSummary(d);
          setFallbackMonth(fb);
        }
      } catch (err) {
        if (rangeRef.current === key) {
          setSummary([]);
          setFallbackMonth(null);
          setError(err instanceof Error ? err.message : 'Data load nahi ho paaya');
        }
      } finally {
        if (rangeRef.current === key) setLoading(false);
      }
    })();
  };

  useEffect(() => {
    load(effFrom, effTo, dateMode);
  }, [effFrom, effTo, dateMode]);

  // Month badalne par date filter khali ho jaata hai (pure mahine ka hisaab)
  const onMonthChange = (m: string) => {
    setMonth(m || currentMonthIST());
    setFrom('');
    setTo('');
  };

  const onFromChange = (v: string) => {
    setFrom(v);
    if (v && to && v > to) setTo(v); // from, to se aage ho gayi to to ko bhi saath le lo
    if (!v && !to) setMonth(currentMonthIST()); // dono date hata di -> chalu mahina
  };

  const onToChange = (v: string) => {
    setTo(v);
    if (v && from && v < from) setFrom(v);
    if (!v && !from) setMonth(currentMonthIST()); // dono date hata di -> chalu mahina
  };

  // Reset: date filter pura khali, chalu mahine ka hisaab
  const resetRange = () => {
    setFrom('');
    setTo('');
    setMonth(currentMonthIST());
  };

  // Chalu mahine me koi aaya / late hua to hisaab turant naya ho
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useLiveEvents('admin', true, (event) => {
    // Range me aaj ki date shamil ho tabhi live refresh
    if ((event === 'attendance' || event === 'reconnected') && rangeRefValues.current.effTo >= todayIST()) {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        const r = rangeRefValues.current;
        load(r.effFrom, r.effTo, r.dateMode, true);
      }, 1500);
    }
  });

  const rows = useMemo(() => {
    const byEmp = new Map(summary.map((r) => [r.employeeId, r]));
    const q = search.trim().toLowerCase();
    // Jo employee is range ke baad join hua (ya us mahine ke baad), usko nahi dikhana
    const rangeEnd = fallbackMonth ? `${fallbackMonth}-31` : effTo;
    return employees
      .filter((emp) => {
        const j = (emp.joiningDate || '').slice(0, 10);
        return !/^\d{4}-\d{2}-\d{2}$/.test(j) || j <= rangeEnd;
      })
      .map((emp) => ({
        emp,
        s: byEmp.get(emp.id) || { employeeId: emp.id, came: 0, late: 0, half: 0, absent: 0, leave: 0, minutes: 0, outMinutes: 0 },
      }))
      .filter(
        ({ emp }) =>
          !q || emp.fullName.toLowerCase().includes(q) || emp.empId.toLowerCase().includes(q) || emp.department.toLowerCase().includes(q)
      )
      .sort((a, b) => b.s.came - a.s.came || a.emp.fullName.localeCompare(b.emp.fullName));
  }, [employees, summary, search, effTo, fallbackMonth]);

  // Chuni hui date range me kisi bhi employee ka koi attendance/leave record nahi hai
  const noActivity = !hasActivity(summary);
  const fallbackLabel = fallbackMonth ? new Date(`${fallbackMonth}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '';

  const rangeLabel = dateMode
    ? effFrom === effTo
      ? fmtDate(effFrom)
      : `${fmtDate(effFrom)} – ${fmtDate(effTo)}`
    : month
      ? new Date(`${month}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
      : '';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Monthly Attendance (महीने की उपस्थिति)</h3>
          <p className="text-xs text-slate-500">
            {rangeLabel || 'Is mahine'}: kaun kitne din aaya, kitni baar late, half day, leave aur absent. Attendance sirf working hours me lagti hai.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-indigo-600" />
            <input
              type="month"
              value={month}
              max={currentMonthIST()}
              onChange={(e) => onMonthChange(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-500"
            />
          </div>
          <label className="text-[10px] font-semibold text-slate-500">
            From date
            <input
              type="date"
              value={from}
              max={todayIST()}
              onChange={(e) => onFromChange(e.target.value)}
              className="mt-0.5 block bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-500"
            />
          </label>
          <label className="text-[10px] font-semibold text-slate-500">
            To date
            <input
              type="date"
              value={to}
              min={from || undefined}
              max={todayIST()}
              onChange={(e) => onToChange(e.target.value)}
              className="mt-0.5 block bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-500"
            />
          </label>
          <button
            type="button"
            onClick={resetRange}
            title="Chalu mahine par wapas"
            className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <X className="w-3.5 h-3.5" /> Reset
          </button>
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

      {dateMode && fallbackMonth && (
        <div className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl p-3">
          Chuni hui date range me attendance nahi mili, isliye {fallbackLabel} ki attendance dikha rahe hain.
        </div>
      )}
      {dateMode && !loading && !error && !fallbackMonth && noActivity && rows.length > 0 && (
        <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3">Is date range me kisi ki attendance nahi mili.</div>
      )}

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
                <td colSpan={9} className="py-8 text-center text-slate-500 font-semibold">
                  No employee found
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
