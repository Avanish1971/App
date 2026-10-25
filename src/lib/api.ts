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
  AdminMessage,
  InboxMessage,
  EmployeeDocument,
  EmployeeDocType,
  LeaveBalance,
  ClientVisit,
} from '../types';
import { getToken, clearToken, AUTH_EXPIRED_EVENT } from './auth';

// Backend ka address:
//  1) .env me VITE_API_URL ho to wahi
//  2) site laptop par (localhost) khuli ho to laptop ka backend  (http://localhost:5000)
//  3) baaki sab jagah (AWS website, phone ka app) AWS ka backend
export const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'http://54.253.216.68:5000');

async function request<T>(path: string, options?: RequestInit, withAuth = true): Promise<T> {
  const token = withAuth ? getToken() : null;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    // Token expire ho gaya ya galat hai: login page par wapas bhejo
    if (res.status === 401 && token) {
      clearToken();
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
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

export const deleteEmployeeApi = (employeeId: string, confirmEmpId: string) =>
  request<{
    ok: boolean;
    deleted: { attendance: number; leaves: number; regularizations: number; expenses: number };
  }>(`/api/employees/${employeeId}?confirm=${encodeURIComponent(confirmEmpId)}`, { method: 'DELETE' });

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
// Ek mahine (YYYY-MM) ke saare employees ke records — monthly report ke liye
export const getAttendanceMonthApi = (month: string) =>
  request<AttendanceRecord[]>(`/api/attendance/monthly/${month}`);
// Ek employee ki poori attendance history
export const getEmployeeAttendanceApi = (employeeId: string) =>
  request<AttendanceRecord[]>(`/api/attendance/${employeeId}`);
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

// ---- Login ----
export const adminLoginApi = (email: string, password: string) =>
  request<{ token: string }>(
    '/api/auth/admin-login',
    { method: 'POST', body: JSON.stringify({ email, password }) },
    false
  );
export const employeeLoginApi = (loginId: string, password: string) =>
  request<{ token: string; employee: { id: string; empId: string; fullName: string } }>(
    '/api/auth/employee-login',
    { method: 'POST', body: JSON.stringify({ loginId, password }) },
    false
  );

// ---- Employee ka apna data (mobile app) ----
export interface MeData {
  employee: Employee;
  office: Office | null;
  shift: Shift | null;
  attendance: AttendanceRecord | null;
  leaves: LeaveRequest[];
  leaveBalance?: LeaveBalance;
}
export const getMeApi = () => request<MeData>('/api/me');

// ---- Messages ----
export const getMessagesApi = () => request<AdminMessage[]>('/api/messages');
// recipientIds khali = sabhi employees ko
export const sendMessageApi = (text: string, recipientIds: string[]) =>
  request<AdminMessage>('/api/messages', { method: 'POST', body: JSON.stringify({ text, recipientIds }) });
export const getMyMessagesApi = () => request<InboxMessage[]>('/api/me/messages');
export const markMyMessagesReadApi = () =>
  request<{ ok: boolean }>('/api/me/messages/read', { method: 'POST' });

export const getMyLeaveBalanceApi = () => request<LeaveBalance>('/api/me/leave-balance');

// ---- Employee documents (file MongoDB me save hoti hai) ----
export const getEmployeeDocumentsApi = (employeeId: string) =>
  request<EmployeeDocument[]>(`/api/employees/${employeeId}/documents`);

export const uploadEmployeeDocumentApi = (
  employeeId: string,
  doc: { type: EmployeeDocType; label?: string; fileName: string; mimeType: string; dataBase64: string }
) =>
  request<EmployeeDocument>(`/api/employees/${employeeId}/documents`, {
    method: 'POST',
    body: JSON.stringify(doc),
  });

export const deleteEmployeeDocumentApi = (employeeId: string, docId: string) =>
  request<{ ok: boolean }>(`/api/employees/${employeeId}/documents/${docId}`, { method: 'DELETE' });

// File dekhne ke liye: token ke saath download karke naye tab me kholo
export async function openEmployeeDocumentApi(employeeId: string, docId: string) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/api/employees/${employeeId}/documents/${docId}/file`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'File nahi khul paayi');
  }
  const url = URL.createObjectURL(await res.blob());
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// ---- Leave balance (admin) ----
export const getEmployeeLeaveBalanceApi = (employeeId: string) =>
  request<LeaveBalance>(`/api/employees/${employeeId}/leave-balance`);

// ---- Branch transfer ----
export const transferEmployeeApi = (
  employeeId: string,
  payload: { officeId: string; shiftId?: string; reportingManager?: string; reason?: string }
) =>
  request<Employee>(`/api/employees/${employeeId}/transfer`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

// ---- Field work: client visit ----
export interface ClientVisitPayload {
  clientName: string;
  clientLocation: string;
  contactPerson?: string;
  contactPhone?: string;
  purpose: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  selfieBase64: string;
  selfieMime: string;
  sitePhotoBase64: string;
  sitePhotoMime: string;
}
export const submitClientVisitApi = (payload: ClientVisitPayload) =>
  request<{ record: AttendanceRecord; visit: ClientVisit }>('/api/me/client-visits', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// Admin: visits ki list. date YA from+to, aur optional employeeId
export const getClientVisitsApi = (params: { date?: string; from?: string; to?: string; employeeId?: string }) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v && q.set(k, v));
  return request<ClientVisit[]>(`/api/client-visits?${q.toString()}`);
};

// Photo token ke saath laao aur <img> ke liye object URL do
export async function fetchClientVisitPhotoUrl(visitId: string, kind: 'selfie' | 'site'): Promise<string> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/api/client-visits/${visitId}/photo/${kind}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Photo nahi mili');
  return URL.createObjectURL(await res.blob());
}
