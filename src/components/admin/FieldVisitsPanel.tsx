import { useState } from 'react';
import { Employee } from '../../types';
import { FieldVisitList } from './FieldVisitList';
import { CalendarDays, Route } from 'lucide-react';

const todayIST = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

// Sidebar ka "Field Visits": din chuno, chaho to ek employee chuno
export function FieldVisitsPanel({ employees }: { employees: Employee[] }) {
  const [date, setDate] = useState(todayIST());
  const [employeeId, setEmployeeId] = useState('');
  const fieldStaff = employees.filter((e) => e.workType === 'FIELD_WORK');

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Route className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Field Visits (फील्ड वर्क)</h3>
            <p className="text-xs text-slate-500">Kaun kaha gaya, kyu gaya, client ki info, live location aur photos</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-500"
          >
            <option value="">Sabhi field employees</option>
            {fieldStaff.map((e) => (
              <option key={e.id} value={e.id}>
                {e.fullName}
              </option>
            ))}
          </select>
          <CalendarDays className="w-4 h-4 text-indigo-600" />
          <input
            type="date"
            value={date}
            max={todayIST()}
            onChange={(e) => setDate(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <FieldVisitList filter={{ date, employeeId: employeeId || undefined }} showEmployee />
    </div>
  );
}
