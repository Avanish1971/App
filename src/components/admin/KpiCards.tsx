import { useMemo } from 'react';
import { Employee, AttendanceRecord, LeaveRequest } from '../../types';
import { openOuting } from './OutingBadge';
import { Users, CheckCircle2, Briefcase, UserX, FileCheck } from 'lucide-react';

interface KpiCardsProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  leaves: LeaveRequest[];
  citiesCount: number;
  pendingApprovals: number;
}

const CAME = ['PRESENT', 'ON_DUTY', 'HALF_DAY', 'CHECKED_OUT', 'ON_BREAK', 'WFH'];

// Dashboard ke upar ke KPI: kitne employee, kitne aaye, office me, field par, nahi aaye, bahar gaye...
export function KpiCards({ employees, attendanceRecords, leaves, citiesCount, pendingApprovals }: KpiCardsProps) {
  const k = useMemo(() => {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const active = employees.filter((e) => e.status === 'ACTIVE');
    const recOf = new Map(attendanceRecords.map((r) => [r.employeeId, r]));
    const leaveIds = new Set(
      leaves.filter((l) => l.status === 'APPROVED' && l.startDate <= today && l.endDate >= today).map((l) => l.employeeId)
    );

    const c = { total: active.length, came: 0, wfo: 0, field: 0, notArrived: 0, late: 0, half: 0, leave: 0, absent: 0, out: 0, wfh: 0 };
    for (const e of active) {
      const r = recOf.get(e.id);
      const onLeave = leaveIds.has(e.id) || r?.status === 'ON_LEAVE';
      if (onLeave) {
        c.leave += 1;
        continue;
      }
      const came = Boolean(r && (r.checkInTime || CAME.includes(r.status)));
      if (came) c.came += 1;
      else if (r?.status === 'ABSENT') c.absent += 1;
      else c.notArrived += 1;
      if (!r) continue;

      const isOut = Boolean(openOuting(r) || r.outsideSince);
      const isField = e.workType === 'FIELD_WORK';
      if (r.isLate) c.late += 1;
      if (r.status === 'HALF_DAY') c.half += 1;
      if (r.status === 'ABSENT' && came) c.absent += 1;
      if (r.status === 'WFH') c.wfh += 1;
      if (r.status === 'ON_DUTY') c.field += 1;
      if (isField ? r.status === 'PRESENT' && r.locationType === 'OFFICE' : (r.status === 'PRESENT' || r.status === 'ON_BREAK') && !isOut) c.wfo += 1;
      if (!isField && r.status === 'PRESENT' && isOut) c.out += 1;
    }
    return c;
  }, [employees, attendanceRecords, leaves]);

  const pct = k.total > 0 ? Math.round((k.came / k.total) * 100) : 0;

  // Sirf 5 KPI. "Present Today" = jo bhi aaye hain (office me ya field par). "Field Par" = sirf jo abhi field par hain.
  const cards = [
    { label: 'Total Staff', value: k.total, sub: `${citiesCount} ${citiesCount === 1 ? 'City' : 'Cities'}`, Icon: Users, tone: 'text-slate-900', icon: 'text-indigo-600', border: 'border-slate-200' },
    { label: 'Present Today', value: k.came, sub: `${pct}% · office me ${k.wfo + k.out}, field par ${k.field}`, Icon: CheckCircle2, tone: 'text-emerald-600', icon: 'text-emerald-600', border: 'border-emerald-200' },
    { label: 'Field Par', value: k.field, sub: 'abhi client / field duty par', Icon: Briefcase, tone: 'text-cyan-600', icon: 'text-cyan-600', border: 'border-cyan-200' },
    { label: 'Aaye Nahi', value: k.notArrived, sub: 'abhi tak check-in nahi', Icon: UserX, tone: 'text-slate-700', icon: 'text-slate-500', border: 'border-slate-200' },
    { label: 'Approvals', value: pendingApprovals, sub: 'action required', Icon: FileCheck, tone: 'text-indigo-600', icon: 'text-indigo-600', border: 'border-indigo-200' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map(({ label, value, sub, Icon, tone, icon, border }) => (
        <div key={label} className={`bg-white border ${border} rounded-xl p-3.5 space-y-1`}>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] uppercase font-bold">{label}</span>
            <Icon className={`w-3.5 h-3.5 ${icon}`} />
          </div>
          <div className={`text-xl font-extrabold font-mono ${tone}`}>{value}</div>
          <div className="text-[10px] text-slate-500">{sub}</div>
        </div>
      ))}
    </div>
  );
}
