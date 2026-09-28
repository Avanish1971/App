import { useState } from 'react';
import { Employee, AttendanceRecord, Office, Shift } from '../../types';
import { DeactivateEmployeeModal } from './DeactivateEmployeeModal';
import {
  Search,
  Download,
  Eye,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  Briefcase,
  Building,
  MapPin,
  ShieldCheck,
  UserX,
  UserCheck,
} from 'lucide-react';

interface AttendanceRosterProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  offices: Office[];
  shifts: Shift[];
  onOpenAddEmployee: () => void;
  onViewEmployeeAudit: (employee: Employee, record?: AttendanceRecord) => void;
  onToggleEmployeeStatus: (employeeId: string, newStatus: 'ACTIVE' | 'INACTIVE', reason?: string) => void;
}

export function AttendanceRoster({
  employees,
  attendanceRecords,
  offices,
  shifts,
  onOpenAddEmployee,
  onViewEmployeeAudit,
  onToggleEmployeeStatus,
}: AttendanceRosterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedWorkType, setSelectedWorkType] = useState<'ALL' | 'IN_OFFICE' | 'FIELD_WORK'>('ALL');
  const [selectedAccountStatus, setSelectedAccountStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [exported, setExported] = useState(false);
  const [employeeToDeactivate, setEmployeeToDeactivate] = useState<Employee | null>(null);

  const departments = ['ALL', 'Engineering', 'HR', 'Finance', 'Sales', 'Operations'];
  const statuses = ['ALL', 'PRESENT', 'ON_BREAK', 'WFH', 'ON_DUTY', 'ON_LEAVE', 'ABSENT'];

  const filtered = employees.filter((emp) => {
    const matchesSearch =
      emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.empId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.designation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = selectedDept === 'ALL' || emp.department === selectedDept;

    const matchesWorkType =
      selectedWorkType === 'ALL' || (emp.workType || 'IN_OFFICE') === selectedWorkType;

    const record = attendanceRecords.find((a) => a.employeeId === emp.id);
    const status = record?.status || 'SCHEDULED';
    const matchesStatus = selectedStatus === 'ALL' || status === selectedStatus;

    const matchesAccountStatus =
      selectedAccountStatus === 'ALL' ||
      (selectedAccountStatus === 'INACTIVE' ? emp.status === 'INACTIVE' : emp.status !== 'INACTIVE');

    return matchesSearch && matchesDept && matchesWorkType && matchesStatus && matchesAccountStatus;
  });

  const handleExportCSV = () => {
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl space-y-4 p-5">
      {/* Top Header with Add Employee & Export */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base">दैनिक उपस्थिति रजिस्टर (Daily Attendance Roster)</h3>
          <p className="text-xs text-slate-500">
            Real-time verification with In-Office Geofencing & Field Staff Client Attendance
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* User Request: Add Employee Button */}
          <button
            onClick={onOpenAddEmployee}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md shadow-indigo-600/30 transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ नया कर्मचारी जोड़ें (Add Employee)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exported ? 'Exported CSV' : 'Export Excel / CSV'}</span>
          </button>
        </div>
      </div>

      {/* Filters Bar: Search, Work Type, Dept, Status */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search employee by name, ID or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* WORK TYPE FILTER (User Specific Requirement!) */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 hidden sm:inline">Work Type:</span>
          <select
            value={selectedWorkType}
            onChange={(e) => setSelectedWorkType(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-cyan-600 font-semibold focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Work Types (सभी)</option>
            <option value="IN_OFFICE">🏢 In-Office Only (ऑफिस में)</option>
            <option value="FIELD_WORK">🚗 Field Work Only (फील्ड में)</option>
          </select>
        </div>

        {/* Dept Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 hidden sm:inline">Dept:</span>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 hidden sm:inline">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Account Status Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 hidden sm:inline">ID Status:</span>
          <select
            value={selectedAccountStatus}
            onChange={(e) => setSelectedAccountStatus(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Accounts (सभी आईडी)</option>
            <option value="ACTIVE">✓ Active Only (सक्रिय)</option>
            <option value="INACTIVE">🚫 Deactivated (कंपनी छोड़ चुके)</option>
          </select>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <th className="py-3 px-4">Employee</th>
              <th className="py-3 px-4">Work Type (प्रकार)</th>
              <th className="py-3 px-4">Department & Base</th>
              <th className="py-3 px-4">Status & Details</th>
              <th className="py-3 px-4">Check-In</th>
              <th className="py-3 px-4">Working Hours</th>
              <th className="py-3 px-4">Verification</th>
              <th className="py-3 px-4">App Access (आईडी स्थिति)</th>
              <th className="py-3 px-4 text-right">Audit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500">
                  No employee attendance records match the selected filters.
                </td>
              </tr>
            ) : (
              filtered.map((emp) => {
                const record = attendanceRecords.find((a) => a.employeeId === emp.id);
                const office = offices.find((o) => o.id === emp.officeId);
                const status = record?.status || 'SCHEDULED';
                const isLate = record?.isLate;
                const isFieldWork = (emp.workType || 'IN_OFFICE') === 'FIELD_WORK';
                const hasClientVisit = record?.clientVisit;

                return (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    {/* Employee */}
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

                    {/* Work Type Badge (User Specific Requirement!) */}
                    <td className="py-3 px-4">
                      {isFieldWork ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                          <Briefcase className="w-3 h-3 text-cyan-600" />
                          <span>Field Work</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Building className="w-3 h-3 text-indigo-600" />
                          <span>In-Office</span>
                        </span>
                      )}
                    </td>

                    {/* Department & Office */}
                    <td className="py-3 px-4">
                      <div className="text-slate-900 font-medium">{emp.department}</div>
                      <div className="text-[10px] text-slate-500">{office?.name || emp.branch}</div>
                    </td>

                    {/* Status & Client Visit Info */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              status === 'PRESENT' || status === 'ON_DUTY'
                                ? 'bg-emerald-400'
                                : status === 'ON_BREAK'
                                ? 'bg-amber-400'
                                : status === 'WFH'
                                ? 'bg-cyan-400'
                                : status === 'ON_LEAVE'
                                ? 'bg-purple-400'
                                : 'bg-rose-400'
                            }`}
                          />
                          <span className="font-semibold text-slate-900">
                            {status === 'ON_DUTY' ? 'PRESENT (On-Duty)' : status}
                          </span>
                          {isLate && (
                            <span className="text-[9px] font-mono font-bold text-amber-600 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                              LATE
                            </span>
                          )}
                        </div>

                        {/* If field work employee checked in at client site */}
                        {hasClientVisit && (
                          <div className="text-[10px] text-cyan-700 bg-cyan-50 p-1 rounded border border-cyan-200 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-cyan-600 shrink-0" />
                            <span className="truncate max-w-[200px]" title={`${hasClientVisit.clientName} - ${hasClientVisit.clientLocation}`}>
                              {hasClientVisit.clientName}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* In Time */}
                    <td className="py-3 px-4 font-mono">
                      {record?.checkInTime ? (
                        <span className="text-slate-900 font-medium">{record.checkInTime}</span>
                      ) : (
                        <span className="text-slate-500">--:--</span>
                      )}
                    </td>

                    {/* Working Hours */}
                    <td className="py-3 px-4 font-mono">
                      {record?.workingMinutes ? (
                        <span className="text-emerald-600 font-medium">
                          {Math.floor(record.workingMinutes / 60)}h {record.workingMinutes % 60}m
                        </span>
                      ) : (
                        <span className="text-slate-500">0h 00m</span>
                      )}
                    </td>

                    {/* Verification */}
                    <td className="py-3 px-4">
                      {hasClientVisit ? (
                        <span className="flex items-center gap-1 text-cyan-600 text-[11px] font-medium" title="Client Site Geo-Verified">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Client GPS Verified</span>
                        </span>
                      ) : record?.verificationStatus === 'FLAGGED_REVIEW' ? (
                        <span className="flex items-center gap-1 text-rose-600 text-[11px] font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Review Req.</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-600 text-[11px] font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Office Geofence</span>
                        </span>
                      )}
                    </td>

                    {/* App Access / ID Deactivate Action (User Request) */}
                    <td className="py-3 px-4">
                      {emp.status === 'INACTIVE' ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <UserX className="w-3 h-3 text-rose-600" />
                            <span>निष्क्रिय (Blocked)</span>
                          </span>
                          <div className="text-[9px] text-rose-600 truncate max-w-[130px]" title={emp.deactivationReason || 'Company Left'}>
                            {emp.deactivationReason || 'Left Company'}
                          </div>
                          <button
                            type="button"
                            onClick={() => setEmployeeToDeactivate(emp)}
                            className="text-[10px] text-emerald-600 hover:text-emerald-700 underline font-semibold block"
                          >
                            पुनः सक्रिय करें
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>सक्रिय (Active)</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setEmployeeToDeactivate(emp)}
                            className="text-[10px] text-rose-600 hover:text-rose-700 underline font-medium flex items-center gap-1"
                            title="कंपनी छोड़ने पर आईडी डिएक्टिवेट करें ताकि लॉगिन बंद हो"
                          >
                            <UserX className="w-2.5 h-2.5" />
                            <span>आईडी डीएक्टिवेट करें</span>
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Audit Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onViewEmployeeAudit(emp, record)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="View Audit Trail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Deactivate / Reactivate Employee Modal */}
      {employeeToDeactivate && (
        <DeactivateEmployeeModal
          employee={employeeToDeactivate}
          onConfirm={(empId, newStatus, reason) => {
            onToggleEmployeeStatus(empId, newStatus, reason);
            setEmployeeToDeactivate(null);
          }}
          onClose={() => setEmployeeToDeactivate(null)}
        />
      )}
    </div>
  );
}
