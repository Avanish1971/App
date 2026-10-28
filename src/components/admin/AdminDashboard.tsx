import { useState } from 'react';
import {
  Office,
  Employee,
  AttendanceRecord,
  Shift,
  LeaveRequest,
  RegularizationRequest,
  ExpenseClaim,
  PayrollRun,
  AttendancePolicy,
  AuditLogEntry,
} from '../../types';
import { GeofenceMap } from './GeofenceMap';
import { OfficeLocations } from './OfficeLocations';
import type { OfficeInput } from '../../lib/api';
import { AttendanceRoster } from './AttendanceRoster';
import { ApprovalCenter } from './ApprovalCenter';
// import { PayrollModule } from './PayrollModule';
import { ShiftPolicySettings } from './ShiftPolicySettings';
import { AuditLogViewer } from './AuditLogViewer';
import { AddEmployeeModal } from './AddEmployeeModal';
import { AdminSidebar, AdminTab } from './AdminSidebar';
import { MonthlyAttendanceReport } from './MonthlyAttendanceReport';
import { EmployeeDirectory } from './EmployeeDirectory';
import { MessageCenter } from './MessageCenter';
import { FieldVisitsPanel } from './FieldVisitsPanel';
import type { PendingDocument } from '../../lib/files';
import type { PickedPhoto } from './AvatarPicker';
import {
  Users,
  CheckCircle2,
  XCircle,
  Calendar,
  Home,
  Clock,
  IndianRupee,
  Navigation,
  FileCheck,
  Sliders,
  Shield,
  X,
  Briefcase,
  Building,
  MapPin,
  UserPlus,
  LogOut,
  HelpCircle,
  Menu,
} from 'lucide-react';
import { formatINR } from '../../utils/payroll';

interface AdminDashboardProps {
  offices: Office[];
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  shifts: Shift[];
  leaves: LeaveRequest[];
  regularizations: RegularizationRequest[];
  expenses: ExpenseClaim[];
  payrollRun: PayrollRun;
  policy: AttendancePolicy;
  auditLogs: AuditLogEntry[];
  onUpdateOfficeRadius: (officeId: string, newRadius: number) => void;
  onAddOffice: (data: OfficeInput) => Promise<void>;
  onUpdateOffice: (id: string, data: OfficeInput) => Promise<void>;
  onDeleteOffice: (id: string, moveToOfficeId?: string) => Promise<void>;
  onActionLeave: (id: string, action: 'APPROVED' | 'REJECTED') => void;
  onActionRegularization: (id: string, action: 'APPROVED' | 'REJECTED') => void;
  onActionExpense: (id: string, action: 'APPROVED' | 'REJECTED') => void;
  onLockPayroll: () => void;
  onSavePolicy: (newPolicy: AttendancePolicy) => void;
  onAddEmployee: (newEmployee: Employee, docs: PendingDocument[], photo: PickedPhoto | null) => Promise<{ failed: string[] }>;
  onEmployeeUpdated: (employee: Employee) => void;
  onTransferEmployee: (
    employeeId: string,
    payload: { officeId: string; shiftId?: string; reportingManager?: string; reason?: string }
  ) => Promise<void>;
  onToggleEmployeeStatus: (employeeId: string, newStatus: 'ACTIVE' | 'INACTIVE', reason?: string) => void;
  onDeleteEmployee: (employeeId: string, confirmEmpId: string) => Promise<void>;
  onLogout: () => void;
}

export function AdminDashboard({
  offices,
  employees,
  attendanceRecords,
  shifts,
  leaves,
  regularizations,
  expenses,
  payrollRun,
  policy,
  auditLogs,
  onUpdateOfficeRadius,
  onAddOffice,
  onUpdateOffice,
  onDeleteOffice,
  onActionLeave,
  onActionRegularization,
  onActionExpense,
  onLockPayroll,
  onSavePolicy,
  onAddEmployee,
  onTransferEmployee,
  onEmployeeUpdated,
  onToggleEmployeeStatus,
  onDeleteEmployee,
  onLogout,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('map');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [directoryEmployeeId, setDirectoryEmployeeId] = useState<string | null>(null);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [inspectAuditEmployee, setInspectAuditEmployee] = useState<{
    employee: Employee;
    record?: AttendanceRecord;
  } | null>(null);

  // Metrics — sab live data (employees/attendanceRecords/offices) se calculate hote hain
  const totalEmployees = employees.filter((e) => e.status === 'ACTIVE').length;
  const presentToday = attendanceRecords.filter(
    (a) => a.status === 'PRESENT' || a.status === 'ON_BREAK' || a.status === 'ON_DUTY'
  ).length;
  const absentToday = attendanceRecords.filter((a) => a.status === 'ABSENT').length;
  const onLeaveToday = attendanceRecords.filter((a) => a.status === 'ON_LEAVE').length;
  const wfhToday = attendanceRecords.filter((a) => a.status === 'WFH').length;
  const lateToday = attendanceRecords.filter((a) => a.isLate).length;
  const attendancePercent = totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0;
  const citiesCount = new Set(offices.map((o) => o.city)).size;
  const pendingApprovalsCount =
    leaves.filter((l) => l.status === 'PENDING').length +
    regularizations.filter((r) => r.status === 'PENDING').length +
    expenses.filter((e) => e.status === 'PENDING').length;

  return (
    <div className="flex items-start">
    <AdminSidebar
      activeTab={activeTab}
      onChange={(tab) => {
        if (tab === 'employees') setDirectoryEmployeeId(null);
        setActiveTab(tab);
      }}
      onAddEmployee={() => setShowAddEmployeeModal(true)}
      pendingApprovalsCount={pendingApprovalsCount}
      open={sidebarOpen}
      onClose={() => setSidebarOpen(false)}
    />
    <div className="flex-1 min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Mobile: sidebar kholne ka button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-700"
      >
        <Menu className="w-4 h-4" />
        <span>Menu</span>
      </button>

      {/* Top Organization Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
              Innovate Soft
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Workforce Attendance & HR Operations
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-xs hidden sm:block">
            <div className="font-semibold text-slate-900">HR & Operations Manager</div>
            <div className="text-slate-500 font-mono text-[11px]">Sneha Kulkarni</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-md">
            SK
          </div>

          <button
            onClick={onLogout}
            title="Admin Logout / Lock Portal"
            className="p-2 bg-slate-100 hover:bg-slate-100 text-slate-500 hover:text-rose-700 rounded-xl border border-slate-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top Executive KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Total Staff */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] uppercase font-bold">Total Staff</span>
            <Users className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 font-mono">{totalEmployees}</div>
          <div className="text-[10px] text-slate-500">Across {citiesCount} {citiesCount === 1 ? 'City' : 'Cities'}</div>
        </div>

        {/* Present */}
        <div className="bg-white border border-emerald-200 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-[10px] uppercase font-bold">Present Today</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-extrabold text-emerald-600 font-mono">{presentToday}</div>
          <div className="text-[10px] text-slate-500">{attendancePercent}% Attendance</div>
        </div>

        {/* Absent */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] uppercase font-bold">Absent</span>
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-xl font-extrabold text-rose-600 font-mono">{absentToday}</div>
          <div className="text-[10px] text-slate-500">LOP Processing</div>
        </div>

        {/* On Leave */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] uppercase font-bold">On Leave</span>
            <Calendar className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-xl font-extrabold text-purple-600 font-mono">{onLeaveToday}</div>
          <div className="text-[10px] text-slate-500">Approved Quota</div>
        </div>

        {/* WFH */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] uppercase font-bold">WFH / Field</span>
            <Home className="w-3.5 h-3.5 text-cyan-600" />
          </div>
          <div className="text-xl font-extrabold text-cyan-600 font-mono">{wfhToday}</div>
          <div className="text-[10px] text-slate-500">Remote Checked</div>
        </div>

        {/* Late Today */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] uppercase font-bold">Late Arrival</span>
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl font-extrabold text-amber-600 font-mono">{lateToday}</div>
          <div className="text-[10px] text-slate-500">&gt; 15 min grace</div>
        </div>

        {/* Approvals Pending */}
        <div className="bg-white border border-indigo-200 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-indigo-600">
            <span className="text-[10px] uppercase font-bold">Approvals</span>
            <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-xl font-extrabold text-indigo-600 font-mono">{pendingApprovalsCount}</div>
          <div className="text-[10px] text-slate-500">Action Required</div>
        </div>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'map' && (
          <GeofenceMap
            offices={offices}
            employees={employees}
            attendanceRecords={attendanceRecords}
            onUpdateOfficeRadius={onUpdateOfficeRadius}
          />
        )}

        {activeTab === 'locations' && (
          <OfficeLocations
            offices={offices}
            employees={employees}
            onAddOffice={onAddOffice}
            onUpdateOffice={onUpdateOffice}
            onDeleteOffice={onDeleteOffice}
          />
        )}

        {activeTab === 'roster' && (
          <AttendanceRoster
            employees={employees}
            attendanceRecords={attendanceRecords}
            offices={offices}
            shifts={shifts}
            onViewEmployeeAudit={(emp, rec) => setInspectAuditEmployee({ employee: emp, record: rec })}
            onToggleEmployeeStatus={onToggleEmployeeStatus}
            onDeleteEmployee={onDeleteEmployee}
          />
        )}

        {activeTab === 'monthly' && (
          <MonthlyAttendanceReport
            employees={employees}
            offices={offices}
            onOpenEmployee={(id) => {
              setDirectoryEmployeeId(id);
              setActiveTab('employees');
            }}
          />
        )}

        {activeTab === 'employees' && (
          <EmployeeDirectory
            employees={employees}
            offices={offices}
            shifts={shifts}
            initialEmployeeId={directoryEmployeeId}
            attendanceRecords={attendanceRecords}
            onToggleEmployeeStatus={onToggleEmployeeStatus}
            onDeleteEmployee={onDeleteEmployee}
            onViewAudit={(emp, rec) => setInspectAuditEmployee({ employee: emp, record: rec })}
            onTransferEmployee={onTransferEmployee}
            onEmployeeUpdated={onEmployeeUpdated}
          />
        )}

        {activeTab === 'messages' && <MessageCenter employees={employees} />}

        {activeTab === 'visits' && <FieldVisitsPanel employees={employees} />}

        {activeTab === 'approvals' && (
          <ApprovalCenter
            leaves={leaves}
            regularizations={regularizations}
            expenses={expenses}
            onActionLeave={onActionLeave}
            onActionRegularization={onActionRegularization}
            onActionExpense={onActionExpense}
          />
        )}

        {/* {activeTab === 'payroll' && (
          <PayrollModule
            payrollRun={payrollRun}
            onLockPayroll={onLockPayroll}
          />
        )} */}

        {activeTab === 'policy' && (
          <ShiftPolicySettings
            policy={policy}
            shifts={shifts}
            onSavePolicy={onSavePolicy}
          />
        )}

        {activeTab === 'audit' && <AuditLogViewer logs={auditLogs} />}
      </div>

      {/* Staff Audit Inspection Modal */}
      {inspectAuditEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <img
                  src={inspectAuditEmployee.employee.avatar}
                  alt={inspectAuditEmployee.employee.fullName}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-full border border-slate-300 object-cover"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">{inspectAuditEmployee.employee.fullName}</h4>
                    {inspectAuditEmployee.employee.workType === 'FIELD_WORK' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-cyan-600" /> Field Work
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                        <Building className="w-3 h-3 text-indigo-600" /> In-Office
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {inspectAuditEmployee.employee.empId} · {inspectAuditEmployee.employee.department} · {inspectAuditEmployee.employee.designation}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectAuditEmployee(null)}
                className="p-1 text-slate-500 hover:text-slate-900 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Employee Login Credentials Card */}
            <div className={`p-2.5 rounded-xl border flex items-center justify-between text-[11px] ${
              inspectAuditEmployee.employee.status === 'INACTIVE'
                ? 'bg-rose-50 border-rose-200'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <span className="text-slate-500 font-medium">मोबाइल ऐप लॉगिन आईडी: </span>
                <span className="font-mono font-bold text-cyan-700 ml-1">
                  {inspectAuditEmployee.employee.loginId || inspectAuditEmployee.employee.empId}
                </span>
                <span className="text-slate-500 mx-2">|</span>
                <span className="text-slate-500 font-medium">पासवर्ड: </span>
                <span className="font-mono font-bold text-emerald-700 ml-1">
                  {inspectAuditEmployee.employee.password || '—'}
                </span>
              </div>
              {inspectAuditEmployee.employee.status === 'INACTIVE' ? (
                <span className="text-[10px] text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded font-bold">
                  🚫 लॉगिन अवरुद्ध (Deactivated)
                </span>
              ) : (
                <span className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                  ✓ App Access Ready
                </span>
              )}
            </div>

            {/* If Client Visit is present */}
            {inspectAuditEmployee.record?.clientVisit && (
              <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-3 text-[11px] text-cyan-700 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-cyan-800">
                  <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                  <span>अधिकृत क्लाइंट विजिट (Verified Client Onsite Visit):</span>
                </div>
                <div><strong>कंपनी / क्लाइंट:</strong> {inspectAuditEmployee.record.clientVisit.clientName}</div>
                <div><strong>स्थान:</strong> {inspectAuditEmployee.record.clientVisit.clientLocation}</div>
                <div><strong>उद्देश्य:</strong> {inspectAuditEmployee.record.clientVisit.purpose}</div>
                {inspectAuditEmployee.record.clientVisit.contactPerson && (
                  <div><strong>क्लाइंट से मिले:</strong> {inspectAuditEmployee.record.clientVisit.contactPerson} {inspectAuditEmployee.record.clientVisit.contactPhone && `(${inspectAuditEmployee.record.clientVisit.contactPhone})`}</div>
                )}
                <div className="text-[10px]">Photos aur poori detail: sidebar → <strong>Field Visits</strong></div>
                <div className="text-[10px] text-emerald-600 font-semibold pt-0.5">
                  ✓ स्टेटस: PRESENT (On-Duty) — गैरहाजिरी नहीं लगाई गई
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Geofence & Event Telemetry Trail
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 max-h-60 overflow-y-auto">
                {inspectAuditEmployee.record?.events.length === 0 ? (
                  <div className="text-center py-4 text-slate-500">No events logged for this record</div>
                ) : (
                  inspectAuditEmployee.record?.events.map((ev, i) => (
                    <div key={ev.id || i} className="border-b border-slate-100 pb-1.5 last:border-0">
                      <div className="flex justify-between font-mono text-slate-700">
                        <span className="font-bold text-indigo-600">{ev.eventType}</span>
                        <span className="text-[10px] text-slate-500">{ev.timestamp}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{ev.note}</div>
                      <div className="text-[9px] text-slate-500 font-mono">
                        Coords: {ev.latitude.toFixed(4)}, {ev.longitude.toFixed(4)} (±{ev.accuracy}m)
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setInspectAuditEmployee(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl text-xs font-semibold"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal (Admin Section Feature) */}
      {showAddEmployeeModal && (
        <AddEmployeeModal
          offices={offices}
          shifts={shifts}
          employees={employees}
          onAddEmployee={onAddEmployee}
          onClose={() => setShowAddEmployeeModal(false)}
        />
      )}

    </div>
    </div>
  );
}
