export type AttendanceStatus =
  | 'SCHEDULED'
  | 'GEOFENCE_DETECTED'
  | 'LOCATION_PENDING'
  | 'LOCATION_VERIFIED'
  | 'PRESENT'
  | 'ON_BREAK'
  | 'CHECKED_OUT'
  | 'OUTSIDE_GEOFENCE'
  | 'CHECKOUT_PENDING'
  | 'ABSENT'
  | 'ON_LEAVE'
  | 'WFH'
  | 'ON_DUTY'
  | 'REGULARIZATION_PENDING'
  | 'REGULARIZED';

export type AttendanceSource = 'AUTO_GEOFENCE' | 'MANUAL' | 'ADMIN' | 'BIOMETRIC' | 'IMPORT' | 'OFFLINE_SYNC';

export interface Office {
  id: string;
  name: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  workingHours: string;
  allowedDepartments: string[];
  activeEmployeeCount: number;
}

export interface Shift {
  id: string;
  name: string;
  startTime: string; // e.g. "10:00 AM"
  endTime: string;   // e.g. "06:00 PM"
  breakDurationMinutes: number;
  gracePeriodMinutes: number;
  lateThresholdMinutes: number;
  earlyCheckoutMinutes: number;
  isOvernight?: boolean;
}

export interface Employee {
  id: string;
  empId: string;
  fullName: string;
  email: string;
  phone: string;
  avatar: string;
  department: string;
  designation: string;
  branch: string;
  officeId: string;
  shiftId: string;
  reportingManager: string;
  joiningDate: string;
  status: 'ACTIVE' | 'ON_NOTICE' | 'INACTIVE';
  deactivationReason?: string;
  deactivatedAt?: string;
  employmentType: 'FULL_TIME' | 'CONTRACT' | 'INTERN';
  workType: 'IN_OFFICE' | 'FIELD_WORK';
  // Login credentials
  loginId: string;
  password: string;
  // Financial info
  ctcAnnual: number;
  basicMonthly: number;
  hraMonthly: number;
  specialAllowanceMonthly: number;
  bankAccount: string;
  ifsc: string;
  pan: string;
  uan: string;
  // Geolocation simulation info
  currentLat: number;
  currentLng: number;
  accuracyMeters: number;
  isMockLocation?: boolean;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  officeId: string;
  shiftId: string;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  checkInLat?: number;
  checkInLng?: number;
  checkInAccuracy?: number;
  checkOutLat?: number;
  checkOutLng?: number;
  workingMinutes: number;
  breakMinutes: number;
  overtimeMinutes: number;
  isLate: boolean;
  isEarlyExit: boolean;
  source: AttendanceSource;
  verificationStatus: 'VERIFIED' | 'FLAGGED_REVIEW' | 'PENDING' | 'REJECTED';
  flagReason?: string;
  clientVisit?: {
    clientName: string;
    clientLocation: string;
    purpose: string;
    timestamp: string;
    latitude: number;
    longitude: number;
  };
  events: AttendanceEvent[];
}

export interface AttendanceEvent {
  id: string;
  timestamp: string;
  eventType:
    | 'GEOFENCE_ENTER'
    | 'LOCATION_VERIFIED'
    | 'CHECK_IN'
    | 'CLIENT_CHECKIN'
    | 'BREAK_START'
    | 'BREAK_END'
    | 'GEOFENCE_EXIT'
    | 'CHECKOUT_PENDING'
    | 'CHECK_OUT'
    | 'FRAUD_SUSPECTED'
    | 'OFFLINE_QUEUED'
    | 'REGULARIZATION_APPLIED';
  latitude: number;
  longitude: number;
  accuracy: number;
  note?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: 'CASUAL' | 'SICK' | 'EARNED' | 'COMP_OFF' | 'UNPAID';
  startDate: string;
  endDate: string;
  daysCount: number;
  isHalfDay: boolean;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  appliedAt: string;
  approvedBy?: string;
  rejectionReason?: string;
}

export interface RegularizationRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  requestedCheckIn: string;
  requestedCheckOut: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  appliedAt: string;
}

export interface ExpenseClaim {
  id: string;
  employeeId: string;
  employeeName: string;
  category: 'TRAVEL' | 'FOOD' | 'ACCOMMODATION' | 'CLIENT_MEET' | 'FUEL' | 'OTHER';
  amount: number;
  date: string;
  description: string;
  receiptName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface IndianPayrollItem {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  pan: string;
  bankAccount: string;
  workingDaysInMonth: number;
  presentDays: number;
  paidLeaveDays: number;
  lopDays: number; // Loss of Pay
  grossMonthlySalary: number;
  basicSalary: number;
  hra: number;
  specialAllowance: number;
  overtimePay: number;
  lopDeduction: number;
  earnedGross: number;
  // Statutory deductions
  epfEmployee: number; // 12% of basic (capped if applicable)
  esiEmployee: number; // 0.75% of gross if gross <= 21000
  professionalTax: number; // ₹200 (state slab)
  tdsDeduction: number; // Income tax deduction
  totalDeductions: number;
  netPayableSalary: number;
  payslipGenerated: boolean;
}

export interface PayrollRun {
  id: string;
  month: string; // e.g. "September 2026"
  totalEmployees: number;
  totalGrossPayable: number;
  totalNetPayable: number;
  totalStatutoryDeductions: number;
  status: 'DRAFT' | 'REVIEWED' | 'APPROVED' | 'LOCKED' | 'PAID';
  lockedAt?: string;
  lockedBy?: string;
  items: IndianPayrollItem[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  ipAddress: string;
}

export interface AttendancePolicy {
  geofenceRadiusMeters: number;
  gpsAccuracyMaxMeters: number;
  exitGracePeriodMinutes: number;
  gracePeriodForLateMinutes: number;
  lateMarkThresholdMinutes: number;
  halfDayThresholdHours: number;
  autoCheckoutTime: string;
  requireMockLocationCheck: boolean;
  allowOfflineAttendance: boolean;
}
