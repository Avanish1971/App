import { Capacitor } from '@capacitor/core';
import { useState, useEffect } from 'react';
import { generateInitialPayrollRun } from './data/seedData';
import {
  getEmployees,
  addEmployeeApi,
  updateEmployeeStatusApi,
  getOffices,
  updateOfficeRadiusApi,
  addOfficeApi,
  updateOfficeApi,
  deleteOfficeApi,
  getShifts,
  getAttendance,
  updateAttendanceTodayApi,
  getLeaves,
  applyLeaveApi,
  actionLeaveApi,
  getRegularizations,
  applyRegularizationApi,
  actionRegularizationApi,
  getExpenses,
  actionExpenseApi,
  getAuditLogs,
  getPolicy,
  savePolicyApi,
} from './lib/api';
import type { OfficeInput } from './lib/api';
import {
  Office,
  Shift,
  Employee,
  AttendanceRecord,
  LeaveRequest,
  RegularizationRequest,
  ExpenseClaim,
  PayrollRun,
  AttendancePolicy,
  AuditLogEntry,
} from './types';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { MobileAppSimulator } from './components/mobile/MobileAppSimulator';
import { UpdateBanner } from './components/UpdateBanner.tsx';
import { useGeofenceTracking } from './components/mobile/useGeofenceTracking';
import { calculateIndianPayrollItem } from './utils/payroll';
import { ShieldCheck } from 'lucide-react';

// Web (browser) ke liye default 'admin' hai. Native APK (Capacitor Android build)
// khud-ba-khud 'mobile' view kholega. Browser mein manually test karna ho toh
// URL ke end mein ?view=mobile lagao.
function getViewFromUrl(): 'admin' | 'mobile' {
  if (Capacitor.isNativePlatform()) return 'mobile';
  if (typeof window === 'undefined') return 'admin';
  const params = new URLSearchParams(window.location.search);
  return params.get('view') === 'mobile' ? 'mobile' : 'admin';
}

// Server bhi India (IST) ki date use karta hai, isliye yahan bhi IST
const todayStr = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

function buildBlankAttendance(employeeId: string, officeId: string, shiftId: string): AttendanceRecord {
  return {
    id: `att_${employeeId}_${todayStr()}`,
    employeeId,
    date: todayStr(),
    officeId,
    shiftId,
    status: 'SCHEDULED',
    workingMinutes: 0,
    breakMinutes: 0,
    overtimeMinutes: 0,
    isLate: false,
    isEarlyExit: false,
    source: 'MANUAL',
    verificationStatus: 'PENDING',
    events: [],
  };
}

export default function App() {
  const [activeView] = useState<'admin' | 'mobile'>(getViewFromUrl());

  // Core State — starts empty, filled from the backend (see useEffect below)
  const [offices, setOffices] = useState<Office[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [regularizations, setRegularizations] = useState<RegularizationRequest[]>([]);
  const [expenses, setExpenses] = useState<ExpenseClaim[]>([]);
  // Note: payroll calculation is still generated on the client from the fetched
  // employees — there is no /api/payroll route on the backend yet.
  const [payrollRun, setPayrollRun] = useState<PayrollRun | null>(null);
  const [policy, setPolicy] = useState<AttendancePolicy | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Mobile view: jo employee abhi "logged in" hai uski id
  const [mobileEmployeeId, setMobileEmployeeId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Mobile: phone ki live location se aaya attendance record state me daalo
  const handleLiveRecord = (record: AttendanceRecord) => {
    setAttendanceRecords((prev) => {
      const exists = prev.some((a) => a.employeeId === record.employeeId && a.date === record.date);
      return exists
        ? prev.map((a) => (a.employeeId === record.employeeId && a.date === record.date ? record : a))
        : [...prev, record];
    });
  };
  const { position: livePosition, status: locationStatus } = useGeofenceTracking(
    activeView === 'mobile' && !isLoading && !loadError ? mobileEmployeeId : null,
    handleLiveRecord
  );

  // Fetch everything from the backend once, when the app first loads.
  useEffect(() => {
    async function loadAll() {
      try {
        setIsLoading(true);
        const [
          officesData,
          shiftsData,
          employeesData,
          attendanceData,
          leavesData,
          regularizationsData,
          expensesData,
          auditLogsData,
          policyData,
        ] = await Promise.all([
          getOffices(),
          getShifts(),
          getEmployees(),
          getAttendance(),
          getLeaves(),
          getRegularizations(),
          getExpenses(),
          getAuditLogs(),
          getPolicy(),
        ]);

        setOffices(officesData);
        setShifts(shiftsData);
        setEmployees(employeesData);
        setAttendanceRecords(attendanceData);
        setLeaves(leavesData);
        setRegularizations(regularizationsData);
        setExpenses(expensesData);
        setAuditLogs(auditLogsData);
        setPolicy(policyData);
        setPayrollRun(generateInitialPayrollRun());
        if (employeesData.length > 0) setMobileEmployeeId(employeesData[0].id);
        setLoadError(null);
      } catch (err) {
        console.error('Failed to load data from backend:', err);
        setLoadError(
          err instanceof Error
            ? err.message
            : 'Could not reach the backend. Is the server running?'
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadAll();
  }, []);

  // Admin screen: har 30 second me attendance aur employees ki location taaza karo
  useEffect(() => {
    if (activeView !== 'admin' || isLoading || loadError) return;
    const timer = setInterval(async () => {
      try {
        const [att, emps] = await Promise.all([getAttendance(), getEmployees()]);
        setAttendanceRecords(att);
        setEmployees(emps);
      } catch {
        // network atka to agli baar phir koshish hogi
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [activeView, isLoading, loadError]);

  // ---- Admin actions — each one now calls the backend, then updates local state ----

  const handleUpdateOfficeRadius = async (officeId: string, newRadius: number) => {
    setOffices((prev) => prev.map((o) => (o.id === officeId ? { ...o, radiusMeters: newRadius } : o)));
    try {
      await updateOfficeRadiusApi(officeId, newRadius);
    } catch (err) {
      console.error('Failed to save office radius:', err);
    }
  };

  const handleActionLeave = async (id: string, action: 'APPROVED' | 'REJECTED') => {
    try {
      const updated = await actionLeaveApi(id, action, 'Sneha Kulkarni (HR)');
      setLeaves((prev) => prev.map((l) => (l.id === id ? updated : l)));
    } catch (err) {
      console.error('Failed to update leave:', err);
    }
  };

  const handleActionRegularization = async (id: string, action: 'APPROVED' | 'REJECTED') => {
    try {
      const updated = await actionRegularizationApi(id, action);
      setRegularizations((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch (err) {
      console.error('Failed to update regularization:', err);
    }
  };

  const handleActionExpense = async (id: string, action: 'APPROVED' | 'REJECTED') => {
    try {
      const updated = await actionExpenseApi(id, action);
      setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
    } catch (err) {
      console.error('Failed to update expense:', err);
    }
  };

  const handleLockPayroll = () => {
    setPayrollRun((prev) =>
      prev
        ? {
            ...prev,
            status: 'LOCKED',
            lockedAt: new Date().toLocaleString(),
            lockedBy: 'Kavita Patel (Finance Manager)',
          }
        : prev
    );
  };

  const handleSavePolicy = async (newPolicy: AttendancePolicy) => {
    setPolicy(newPolicy);
    try {
      await savePolicyApi(newPolicy);
    } catch (err) {
      console.error('Failed to save policy:', err);
    }
  };

  const handleAddEmployee = async (newEmployee: Employee) => {
    try {
      const created = await addEmployeeApi(newEmployee);
      setEmployees((prev) => [created, ...prev]);
    } catch (err) {
      console.error('Failed to add employee:', err);
    }
  };

  const handleToggleEmployeeStatus = async (
    employeeId: string,
    newStatus: 'ACTIVE' | 'INACTIVE',
    reason?: string
  ) => {
    try {
      const updated = await updateEmployeeStatusApi(employeeId, newStatus, reason);
      setEmployees((prev) => prev.map((emp) => (emp.id === employeeId ? updated : emp)));
    } catch (err) {
      console.error('Failed to update employee status:', err);
    }
  };

  // ---- Office locations (admin) ----

  const handleAddOffice = async (data: OfficeInput) => {
    const created = await addOfficeApi(data);
    setOffices((prev) => [...prev, created]);
  };

  const handleUpdateOffice = async (id: string, data: OfficeInput) => {
    const updated = await updateOfficeApi(id, data);
    setOffices((prev) => prev.map((o) => (o.id === id ? updated : o)));
  };

  const handleDeleteOffice = async (id: string) => {
    await deleteOfficeApi(id);
    setOffices((prev) => prev.filter((o) => o.id !== id));
  };

  // ---- Mobile actions — check-in/break/client-visit, leave apply, regularization apply ----

  const handleUpdateAttendance = async (newRecord: AttendanceRecord) => {
    // UI turant update karo, phir backend mein save karo
    setAttendanceRecords((prev) => {
      const exists = prev.some((a) => a.employeeId === newRecord.employeeId && a.date === newRecord.date);
      return exists
        ? prev.map((a) => (a.employeeId === newRecord.employeeId && a.date === newRecord.date ? newRecord : a))
        : [...prev, newRecord];
    });
    try {
      const saved = await updateAttendanceTodayApi(newRecord.employeeId, newRecord);
      setAttendanceRecords((prev) =>
        prev.map((a) => (a.employeeId === saved.employeeId && a.date === saved.date ? saved : a))
      );
    } catch (err) {
      console.error('Failed to save attendance:', err);
    }
  };

  const handleApplyLeaveMobile = async (leave: Omit<LeaveRequest, 'id' | 'appliedAt' | 'status'>) => {
    try {
      const created = await applyLeaveApi(leave);
      setLeaves((prev) => [created, ...prev]);
    } catch (err) {
      console.error('Failed to apply leave:', err);
    }
  };

  const handleApplyRegularizationMobile = async (
    reg: Omit<RegularizationRequest, 'id' | 'appliedAt' | 'status'>
  ) => {
    try {
      const created = await applyRegularizationApi(reg);
      setRegularizations((prev) => [created, ...prev]);
    } catch (err) {
      console.error('Failed to apply regularization:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center">
        <div className="text-sm text-slate-500">Loading data from server…</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-2">
          <div className="text-rose-600 font-bold text-sm">Backend se connect nahi ho paaya</div>
          <p className="text-xs text-slate-500">{loadError}</p>
          <p className="text-xs text-slate-500">
            Check karo ki backend server chal raha hai (`npm run dev` in the server folder),
            aur `.env` mein `VITE_API_URL` sahi hai.
          </p>
        </div>
      </div>
    );
  }

  if (!policy || !payrollRun) return null;

  // ---- MOBILE VIEW ----
  if (activeView === 'mobile') {
    const currentEmployee = employees.find((e) => e.id === mobileEmployeeId) || employees[0];

    if (!currentEmployee) {
      return (
        <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center p-6 text-center text-sm text-slate-500">
          Koi employee nahi mila. Pehle admin dashboard se employee add karo.
        </div>
      );
    }

    const currentOffice =
      offices.find((o) => o.id === currentEmployee.officeId) || offices[0];
    const currentAttendance =
      attendanceRecords.find(
        (a) => a.employeeId === currentEmployee.id && a.date === todayStr()
      ) || buildBlankAttendance(currentEmployee.id, currentEmployee.officeId, currentEmployee.shiftId);
    // Naye employee ka payroll item seed me nahi hota, isliye zaroorat par abhi bana lo
    const currentPayrollItem =
      payrollRun.items.find((i) => i.employeeId === currentEmployee.id) ||
      calculateIndianPayrollItem(
        currentEmployee.id,
        currentEmployee.fullName,
        currentEmployee.department,
        currentEmployee.designation,
        currentEmployee.pan,
        currentEmployee.bankAccount,
        {
          grossMonthly:
            (currentEmployee.basicMonthly || 0) +
            (currentEmployee.hraMonthly || 0) +
            (currentEmployee.specialAllowanceMonthly || 0),
          workingDays: 26,
          presentDays: 26,
          paidLeaveDays: 0,
          lopDays: 0,
          overtimeHours: 0,
        }
      );

    if (!currentOffice || !currentPayrollItem) return null;

    return (
      <>
      <UpdateBanner />
      <MobileAppSimulator
        employee={currentEmployee}
        employees={employees}
        office={currentOffice}
        attendance={currentAttendance}
        payrollItem={currentPayrollItem}
        livePosition={livePosition}
        locationStatus={locationStatus}
        leaves={leaves.filter((l) => l.employeeId === currentEmployee.id)}
        onSelectEmployee={(empId) => setMobileEmployeeId(empId)}
        onUpdateAttendance={handleUpdateAttendance}
        onApplyLeave={handleApplyLeaveMobile}
        onApplyRegularization={handleApplyRegularizationMobile}
      />
      </>
    );
  }

  // ---- ADMIN VIEW (default, web) ----
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-slate-50 text-slate-800 flex flex-col font-sans">
      <UpdateBanner />
      {/* Locked Clean Web Header - No Mode Switchers / No Simulators */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center font-black text-white text-base shadow-lg shadow-indigo-600/30">
            G
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-base tracking-tight">GeoAttend HRMS Console</span>
              <span className="hidden sm:inline-block text-[10px] font-mono text-cyan-600 bg-cyan-50 border border-cyan-200 px-1.5 py-0.2 rounded font-bold">
                MANAGEMENT
              </span>
            </div>
            <p className="text-[10px] text-slate-500 hidden sm:block">
              Enterprise Control Centre - Live Geofence Radar & Automated Payroll
            </p>
          </div>
        </div>

        <div className="flex items-center bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs text-indigo-700 font-semibold gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Super Admin Access Active</span>
        </div>
      </header>

      {/* Direct Original Admin Portal Area */}
      <main className="flex-1">
        <AdminDashboard
          offices={offices}
          employees={employees}
          attendanceRecords={attendanceRecords}
          shifts={shifts}
          leaves={leaves}
          regularizations={regularizations}
          expenses={expenses}
          payrollRun={payrollRun}
          policy={policy}
          auditLogs={auditLogs}
          onUpdateOfficeRadius={handleUpdateOfficeRadius}
          onAddOffice={handleAddOffice}
          onUpdateOffice={handleUpdateOffice}
          onDeleteOffice={handleDeleteOffice}
          onActionLeave={handleActionLeave}
          onActionRegularization={handleActionRegularization}
          onActionExpense={handleActionExpense}
          onLockPayroll={handleLockPayroll}
          onSavePolicy={handleSavePolicy}
          onAddEmployee={handleAddEmployee}
          onToggleEmployeeStatus={handleToggleEmployeeStatus}
        />
      </main>
    </div>
  );
}