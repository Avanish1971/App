
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

// Backend ka address:
//  1) .env me VITE_API_URL ho to wahi
//  2) site laptop par (localhost) khuli ho to laptop ka backend  (http://localhost:5000)
//  3) baaki sab jagah (AWS website, phone ka app) AWS ka backend
const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'http://54.253.216.68:5000');

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status} ${BASE_URL}${path}`);
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

// ---- Office locations (admin) ----
export interface OfficeInput {
  name: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  workingHours: string;
}
export const addOfficeApi = (data: OfficeInput) =>
  request<Office>('/api/offices', { method: 'POST', body: JSON.stringify(data) });
export const updateOfficeApi = (id: string, data: OfficeInput) =>
  request<Office>(`/api/offices/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteOfficeApi = (id: string, moveToOfficeId?: string) =>
  request<{ ok: boolean; employeesMoved: number; movedTo: string | null }>(
    `/api/offices/${id}${moveToOfficeId ? `?moveTo=${encodeURIComponent(moveToOfficeId)}` : ''}`,
    { method: 'DELETE' }
  );

// ---- Live location (mobile app) ----
export interface LocationPingResult {
  record: AttendanceRecord | null;
  inside: boolean | null;
  distanceMeters?: number;
  officeName?: string;
  reason?: string;
  ignored?: string;
}
export const sendLocationPingApi = (
  employeeId: string,
  ping: { latitude: number; longitude: number; accuracy: number }
) =>
  request<LocationPingResult>(`/api/attendance/${employeeId}/location-ping`, {
    method: 'POST',
    body: JSON.stringify(ping),
  });