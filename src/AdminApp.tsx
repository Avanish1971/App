import { useState, useEffect } from 'react';
import { buildPayrollRun } from './utils/payrollRun';
import {
  getEmployees,
  addEmployeeApi,
  updateEmployeeStatusApi,
  deleteEmployeeApi,
  getOffices,
  updateOfficeRadiusApi,
  addOfficeApi,
  updateOfficeApi,
  deleteOfficeApi,
  getShifts,
  getAttendance,
  getLeaves,
  actionLeaveApi,
  getRegularizations,
  actionRegularizationApi,
  getExpenses,
  actionExpenseApi,
  getAuditLogs,
  getPolicy,
  savePolicyApi,
} from './lib/api';
import type { OfficeInput } from './lib/api';
import { clearToken, getToken, isTokenValid, AUTH_EXPIRED_EVENT } from './lib/auth';
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
import { AdminLoginGate } from './components/admin/AdminLoginGate';
import { UpdateBanner } from './components/UpdateBanner.tsx';
import { ShieldCheck } from 'lucide-react';

// Admin website: pehle login page, login ke baad hi portal
export default function AdminApp() {
  // Pehle se valid login hai to seedha portal, nahi to login page
  const [authed, setAuthed] = useState<boolean>(() => isTokenValid(getToken('admin')));

  const [offices, setOffices] = useState<Office[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [regularizations, setRegularizations] = useState<RegularizationRequest[]>([]);
  const [expenses, setExpenses] = useState<ExpenseClaim[]>([]);
  // Payroll abhi bhi client par banta hai (backend me payroll route nahi hai)
  const [payrollRun, setPayrollRun] = useState<PayrollRun | null>(null);
  const [policy, setPolicy] = useState<AttendancePolicy | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Logout / token expire par purana data screen se hata do
  const resetData = () => {
    setOffices([]);
    setShifts([]);
    setEmployees([]);
    setAttendanceRecords([]);
    setLeaves([]);
    setRegularizations([]);
    setExpenses([]);
    setAuditLogs([]);
    setPolicy(null);
    setPayrollRun(null);
    setLoadError(null);
    setIsLoading(true);
  };

  const handleLogout = () => {
    clearToken('admin');
    resetData();
    setAuthed(false);
  };

  // Server ne bola "token galat/expire" -> login page
  useEffect(() => {
    const onExpired = () => {
      resetData();
      setAuthed(false);
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, []);

  // Login hone ke baad hi data mangao
  useEffect(() => {
    if (!authed) return;
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
        setPayrollRun(buildPayrollRun(employeesData));
        setLoadError(null);
      } catch (err) {
        console.error('Failed to load data from backend:', err);
        setLoadError(
          err instanceof Error ? err.message : 'Could not reach the backend. Is the server running?'
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadAll();
  }, [authed]);

  // Admin screen: har 30 second me attendance aur employees ki location taaza karo
  useEffect(() => {
    if (!authed || isLoading || loadError) return;
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
  }, [authed, isLoading, loadError]);

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

  // Employee ki poori profile (aur uska attendance/leave/expense record) hamesha ke liye hatao
  const handleDeleteEmployee = async (employeeId: string, confirmEmpId: string) => {
    await deleteEmployeeApi(employeeId, confirmEmpId);
    setEmployees((prev) => prev.filter((e) => e.id !== employeeId));
    setAttendanceRecords((prev) => prev.filter((a) => a.employeeId !== employeeId));
    setLeaves((prev) => prev.filter((l) => l.employeeId !== employeeId));
    setRegularizations((prev) => prev.filter((r) => r.employeeId !== employeeId));
    setExpenses((prev) => prev.filter((x) => x.employeeId !== employeeId));
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

  const handleDeleteOffice = async (id: string, moveToOfficeId?: string) => {
    await deleteOfficeApi(id, moveToOfficeId);
    const destination = offices.find((o) => o.id === moveToOfficeId);
    setOffices((prev) => prev.filter((o) => o.id !== id));
    // Us office ke employees: dusre office me ya (moveTo na ho to) bina office ke
    setEmployees((prev) =>
      prev.map((e) =>
        e.officeId === id
          ? { ...e, officeId: moveToOfficeId || '', branch: destination ? destination.city : e.branch }
          : e
      )
    );
  };


  // Login nahi hai to sirf login page
  if (!authed) {
    return (
      <>
        <UpdateBanner />
        <AdminLoginGate
          onLoggedIn={() => {
            setIsLoading(true);
            setLoadError(null);
            setAuthed(true);
          }}
        />
      </>
    );
  }

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
          <button
            onClick={handleLogout}
            className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
          >
            Logout / dobara login
          </button>
        </div>
      </div>
    );
  }

  if (!policy || !payrollRun) return null;

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
          onDeleteEmployee={handleDeleteEmployee}
          onLogout={handleLogout}
        />
      </main>
    </div>
  );
}