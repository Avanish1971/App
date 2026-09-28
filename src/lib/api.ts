// Central place for every call to the backend (server/ folder — Express + MongoDB).
// Change VITE_API_URL in your .env file if the backend runs somewhere other than localhost:5000.

import {
  Office,
  Shift,
  Employee,
  AttendanceRecord,
  LeaveRequest,
  RegularizationRequest,
  ExpenseClaim,
  AuditLogEntry,
  AttendancePolicy,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status} ${path}`);
  }
  return res.json();
}

// ---- Employees ----
export const getEmployees = () => request<Employee[]>('/api/employees');
export const addEmployeeApi = (employee: Employee) =>
  request<Employee>('/api/employees', { method: 'POST', body: JSON.stringify(employee) });
export const updateEmployeeStatusApi = (
  employeeId: string,
  status: 'ACTIVE' | 'INACTIVE',
  reason?: string
) =>
  request<Employee>(`/api/employees/${employeeId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, reason }),
  });

// ---- Offices ----
export const getOffices = () => request<Office[]>('/api/offices');
export const updateOfficeRadiusApi = (officeId: string, radiusMeters: number) =>
  request<Office>(`/api/offices/${officeId}/radius`, {
    method: 'PUT',
    body: JSON.stringify({ radiusMeters }),
  });

// ---- Shifts ----
export const getShifts = () => request<Shift[]>('/api/shifts');

// ---- Attendance ----
export const getAttendance = (date?: string) =>
  request<AttendanceRecord[]>(`/api/attendance${date ? `?date=${date}` : ''}`);
export const updateAttendanceTodayApi = (employeeId: string, record: Partial<AttendanceRecord>) =>
  request<AttendanceRecord>(`/api/attendance/${employeeId}/today`, {
    method: 'PUT',
    body: JSON.stringify(record),
  });

// ---- Leaves ----
export const getLeaves = () => request<LeaveRequest[]>('/api/leaves');
export const applyLeaveApi = (leave: Omit<LeaveRequest, 'id' | 'appliedAt' | 'status'>) =>
  request<LeaveRequest>('/api/leaves', { method: 'POST', body: JSON.stringify(leave) });
export const actionLeaveApi = (id: string, status: 'APPROVED' | 'REJECTED', approvedBy?: string) =>
  request<LeaveRequest>(`/api/leaves/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status, approvedBy }),
  });

// ---- Regularizations ----
export const getRegularizations = () => request<RegularizationRequest[]>('/api/regularizations');
export const applyRegularizationApi = (
  reg: Omit<RegularizationRequest, 'id' | 'appliedAt' | 'status'>
) => request<RegularizationRequest>('/api/regularizations', { method: 'POST', body: JSON.stringify(reg) });
export const actionRegularizationApi = (id: string, status: 'APPROVED' | 'REJECTED') =>
  request<RegularizationRequest>(`/api/regularizations/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });

// ---- Expenses ----
export const getExpenses = () => request<ExpenseClaim[]>('/api/expenses');
export const actionExpenseApi = (id: string, status: 'APPROVED' | 'REJECTED') =>
  request<ExpenseClaim>(`/api/expenses/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });

// ---- Audit Logs ----
export const getAuditLogs = () => request<AuditLogEntry[]>('/api/audit-logs');

// ---- Policy ----
export const getPolicy = () => request<AttendancePolicy>('/api/policy');
export const savePolicyApi = (policy: AttendancePolicy) =>
  request<AttendancePolicy>('/api/policy', { method: 'PUT', body: JSON.stringify(policy) });
