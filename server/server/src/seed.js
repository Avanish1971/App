// One-time script: pushes your old hardcoded seedData.ts data into MongoDB.
// Run with: npm run seed
require('dotenv').config();
const connectDB = require('./db');

const Employee = require('./models/Employee');
const Office = require('./models/Office');
const Shift = require('./models/Shift');
const AttendanceRecord = require('./models/AttendanceRecord');
const LeaveRequest = require('./models/LeaveRequest');
const RegularizationRequest = require('./models/RegularizationRequest');
const ExpenseClaim = require('./models/ExpenseClaim');
const AuditLogEntry = require('./models/AuditLogEntry');
const AttendancePolicy = require('./models/AttendancePolicy');

const offices = [
  { id: 'off_mumbai_hq', name: 'Mumbai Head Office', city: 'Mumbai', address: 'Maker Maxity, Bandra Kurla Complex (BKC), Bandra East, Mumbai, Maharashtra 400051', latitude: 19.0657, longitude: 72.8687, radiusMeters: 100, workingHours: '10:00 AM – 06:00 PM', allowedDepartments: ['Engineering', 'HR', 'Finance', 'Operations', 'Executive'], activeEmployeeCount: 16 },
  { id: 'off_pune_hub', name: 'Pune Tech Campus', city: 'Pune', address: 'EON IT Park, Kharadi / Hinjewadi Phase 1, Pune, Maharashtra 411057', latitude: 18.5913, longitude: 73.7389, radiusMeters: 120, workingHours: '09:30 AM – 05:30 PM', allowedDepartments: ['Engineering', 'QA', 'Product', 'DevOps'], activeEmployeeCount: 9 },
  { id: 'off_delhi_sales', name: 'Delhi Regional Office', city: 'New Delhi', address: 'Barakhamba Road, Connaught Place, New Delhi, Delhi 110001', latitude: 28.6315, longitude: 77.2167, radiusMeters: 100, workingHours: '09:30 AM – 06:00 PM', allowedDepartments: ['Sales', 'Enterprise Business', 'Field Relations'], activeEmployeeCount: 5 },
];

const shifts = [
  { id: 'shift_general', name: 'General Day Shift', startTime: '10:00 AM', endTime: '06:00 PM', breakDurationMinutes: 45, gracePeriodMinutes: 15, lateThresholdMinutes: 30, earlyCheckoutMinutes: 30, isOvernight: false },
  { id: 'shift_early', name: 'Early Tech Shift', startTime: '08:30 AM', endTime: '04:30 PM', breakDurationMinutes: 45, gracePeriodMinutes: 15, lateThresholdMinutes: 30, earlyCheckoutMinutes: 30, isOvernight: false },
  { id: 'shift_rotational_night', name: 'Global Operations Shift', startTime: '02:00 PM', endTime: '10:00 PM', breakDurationMinutes: 45, gracePeriodMinutes: 15, lateThresholdMinutes: 30, earlyCheckoutMinutes: 30, isOvernight: false },
];

const employees = [
  { id: 'emp_001', empId: 'ACME-1001', fullName: 'Avanish Dhake', email: 'avanishdhake1@gmail.com', phone: '+91 98201 44521', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80', department: 'Engineering', designation: 'Staff Software Architect', branch: 'Mumbai', officeId: 'off_mumbai_hq', shiftId: 'shift_general', reportingManager: 'Rajesh Nair (VP Tech)', joiningDate: '2023-03-15', status: 'ACTIVE', employmentType: 'FULL_TIME', workType: 'FIELD_WORK', loginId: 'avanish1001', password: 'Pass@123', ctcAnnual: 1850000, basicMonthly: 72000, hraMonthly: 36000, specialAllowanceMonthly: 46166, bankAccount: 'HDFC00012903912', ifsc: 'HDFC0000240', pan: 'ABCDE1234F', uan: '101293847582', currentLat: 19.06572, currentLng: 72.86874, accuracyMeters: 12 },
  { id: 'emp_002', empId: 'ACME-1002', fullName: 'Pooja Sharma', email: 'pooja.sharma@acme.in', phone: '+91 98112 90123', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&h=200&q=80', department: 'HR', designation: 'Lead People Operations', branch: 'Mumbai', officeId: 'off_mumbai_hq', shiftId: 'shift_general', reportingManager: 'Sneha Kulkarni', joiningDate: '2022-06-01', status: 'ACTIVE', employmentType: 'FULL_TIME', workType: 'IN_OFFICE', loginId: 'pooja1002', password: 'Pass@123', ctcAnnual: 1200000, basicMonthly: 45000, hraMonthly: 22500, specialAllowanceMonthly: 32500, bankAccount: 'ICIC00029381923', ifsc: 'ICIC0000104', pan: 'BQWPR9876K', uan: '101882736451', currentLat: 19.06565, currentLng: 72.86882, accuracyMeters: 15 },
  { id: 'emp_003', empId: 'ACME-1003', fullName: 'Rohan Deshmukh', email: 'rohan.deshmukh@acme.in', phone: '+91 97654 32109', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80', department: 'Engineering', designation: 'Senior Mobile Engineer (Flutter)', branch: 'Pune', officeId: 'off_pune_hub', shiftId: 'shift_early', reportingManager: 'Avanish Dhake', joiningDate: '2023-08-10', status: 'ACTIVE', employmentType: 'FULL_TIME', workType: 'IN_OFFICE', loginId: 'rohan1003', password: 'Pass@123', ctcAnnual: 1450000, basicMonthly: 55000, hraMonthly: 27500, specialAllowanceMonthly: 38333, bankAccount: 'SBIN00084729103', ifsc: 'SBIN0001423', pan: 'AXZPD5432M', uan: '101994827163', currentLat: 18.59125, currentLng: 73.73885, accuracyMeters: 8 },
  { id: 'emp_004', empId: 'ACME-1004', fullName: 'Kavita Patel', email: 'kavita.patel@acme.in', phone: '+91 99201 88372', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&h=200&q=80', department: 'Finance', designation: 'Manager - Payroll & Taxation', branch: 'Mumbai', officeId: 'off_mumbai_hq', shiftId: 'shift_general', reportingManager: 'Vikram Merchant (CFO)', joiningDate: '2021-11-15', status: 'ACTIVE', employmentType: 'FULL_TIME', workType: 'IN_OFFICE', loginId: 'kavita1004', password: 'Pass@123', ctcAnnual: 1600000, basicMonthly: 60000, hraMonthly: 30000, specialAllowanceMonthly: 43333, bankAccount: 'KKBK00019283746', ifsc: 'KKBK0000958', pan: 'CPTPK4432L', uan: '101349582736', currentLat: 19.0658, currentLng: 72.86865, accuracyMeters: 10 },
  { id: 'emp_005', empId: 'ACME-1005', fullName: 'Amitabh Verma', email: 'amitabh.verma@acme.in', phone: '+91 98100 12345', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&h=200&q=80', department: 'Sales', designation: 'Director - Enterprise Solutions', branch: 'Delhi', officeId: 'off_delhi_sales', shiftId: 'shift_general', reportingManager: 'CEO', joiningDate: '2021-04-10', status: 'ACTIVE', employmentType: 'FULL_TIME', workType: 'FIELD_WORK', loginId: 'amitabh1005', password: 'Pass@123', ctcAnnual: 2200000, basicMonthly: 85000, hraMonthly: 42500, specialAllowanceMonthly: 55833, bankAccount: 'HDFC00049283719', ifsc: 'HDFC0000120', pan: 'AYZPV9912Q', uan: '101112233445', currentLat: 28.63152, currentLng: 77.21668, accuracyMeters: 14 },
  { id: 'emp_006', empId: 'ACME-1006', fullName: 'Sneha Kulkarni', email: 'sneha.kulkarni@acme.in', phone: '+91 98205 67890', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&h=200&q=80', department: 'HR', designation: 'VP - Human Resources', branch: 'Mumbai', officeId: 'off_mumbai_hq', shiftId: 'shift_general', reportingManager: 'CEO', joiningDate: '2020-02-01', status: 'ACTIVE', employmentType: 'FULL_TIME', workType: 'IN_OFFICE', loginId: 'sneha1006', password: 'Pass@123', ctcAnnual: 2400000, basicMonthly: 90000, hraMonthly: 45000, specialAllowanceMonthly: 65000, bankAccount: 'AXIS00092837461', ifsc: 'UTIB0000042', pan: 'BZZPK3321N', uan: '101556677889', currentLat: 19.06575, currentLng: 72.8687, accuracyMeters: 11 },
  { id: 'emp_007', empId: 'ACME-1007', fullName: 'Deepak Joshi', email: 'deepak.joshi@acme.in', phone: '+91 97234 56781', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&h=200&q=80', department: 'Operations', designation: 'Head of Facilities & Admin', branch: 'Mumbai', officeId: 'off_mumbai_hq', shiftId: 'shift_general', reportingManager: 'Sneha Kulkarni', joiningDate: '2022-01-10', status: 'ACTIVE', employmentType: 'FULL_TIME', workType: 'IN_OFFICE', loginId: 'deepak1007', password: 'Pass@123', ctcAnnual: 1100000, basicMonthly: 42000, hraMonthly: 21000, specialAllowanceMonthly: 28666, bankAccount: 'HDFC00091827364', ifsc: 'HDFC0000240', pan: 'CZZPJ8899Z', uan: '101445566778', currentLat: 19.0656, currentLng: 72.8688, accuracyMeters: 16 },
  { id: 'emp_008', empId: 'ACME-1008', fullName: 'Ananya Roy', email: 'ananya.roy@acme.in', phone: '+91 98300 45678', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&h=200&q=80', department: 'Engineering', designation: 'Senior QA Automation Specialist', branch: 'Pune', officeId: 'off_pune_hub', shiftId: 'shift_general', reportingManager: 'Rohan Deshmukh', joiningDate: '2023-09-01', status: 'ACTIVE', employmentType: 'FULL_TIME', workType: 'IN_OFFICE', loginId: 'ananya1008', password: 'Pass@123', ctcAnnual: 1150000, basicMonthly: 44000, hraMonthly: 22000, specialAllowanceMonthly: 29833, bankAccount: 'ICIC00010293847', ifsc: 'ICIC0000104', pan: 'DZZPR7711K', uan: '101334455667', currentLat: 18.59135, currentLng: 73.73892, accuracyMeters: 9 },
  { id: 'emp_009', empId: 'ACME-1009', fullName: 'Vikram Rathore', email: 'vikram.rathore@acme.in', phone: '+91 99112 34567', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&h=200&q=80', department: 'Sales', designation: 'Enterprise Account Executive', branch: 'Delhi', officeId: 'off_delhi_sales', shiftId: 'shift_general', reportingManager: 'Amitabh Verma', joiningDate: '2023-04-12', status: 'ACTIVE', employmentType: 'FULL_TIME', workType: 'FIELD_WORK', loginId: 'vikram1009', password: 'Pass@123', ctcAnnual: 1300000, basicMonthly: 48000, hraMonthly: 24000, specialAllowanceMonthly: 36333, bankAccount: 'SBIN00099887766', ifsc: 'SBIN0001423', pan: 'EZZPV6655L', uan: '101223344556', currentLat: 28.63145, currentLng: 77.21675, accuracyMeters: 13 },
  { id: 'emp_010', empId: 'ACME-1010', fullName: 'Meera Iyer', email: 'meera.iyer@acme.in', phone: '+91 98401 23456', avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=200&h=200&q=80', department: 'Finance', designation: 'Senior Financial Analyst', branch: 'Mumbai', officeId: 'off_mumbai_hq', shiftId: 'shift_general', reportingManager: 'Kavita Patel', joiningDate: '2022-08-15', status: 'ACTIVE', employmentType: 'FULL_TIME', workType: 'IN_OFFICE', loginId: 'meera1010', password: 'Pass@123', ctcAnnual: 1050000, basicMonthly: 40000, hraMonthly: 20000, specialAllowanceMonthly: 27500, bankAccount: 'HDFC00011223344', ifsc: 'HDFC0000240', pan: 'FZZPI5544P', uan: '101112233990', currentLat: 19.0657, currentLng: 72.86872, accuracyMeters: 12 },
];

const today = new Date().toISOString().slice(0, 10);

const attendance = [
  { id: 'att_001_today', employeeId: 'emp_001', date: today, officeId: 'off_mumbai_hq', shiftId: 'shift_general', status: 'PRESENT', checkInTime: '09:48 AM', checkInLat: 19.06572, checkInLng: 72.86874, checkInAccuracy: 12, workingMinutes: 452, breakMinutes: 38, overtimeMinutes: 0, isLate: false, isEarlyExit: false, source: 'AUTO_GEOFENCE', verificationStatus: 'VERIFIED', events: [] },
  { id: 'att_002_today', employeeId: 'emp_002', date: today, officeId: 'off_mumbai_hq', shiftId: 'shift_general', status: 'PRESENT', checkInTime: '09:54 AM', checkInLat: 19.06565, checkInLng: 72.86882, checkInAccuracy: 15, workingMinutes: 446, breakMinutes: 30, overtimeMinutes: 0, isLate: false, isEarlyExit: false, source: 'AUTO_GEOFENCE', verificationStatus: 'VERIFIED', events: [] },
  { id: 'att_003_today', employeeId: 'emp_003', date: today, officeId: 'off_pune_hub', shiftId: 'shift_early', status: 'PRESENT', checkInTime: '08:24 AM', checkInLat: 18.59125, checkInLng: 73.73885, checkInAccuracy: 8, workingMinutes: 536, breakMinutes: 40, overtimeMinutes: 56, isLate: false, isEarlyExit: false, source: 'AUTO_GEOFENCE', verificationStatus: 'VERIFIED', events: [] },
  { id: 'att_004_today', employeeId: 'emp_004', date: today, officeId: 'off_mumbai_hq', shiftId: 'shift_general', status: 'ON_BREAK', checkInTime: '10:05 AM', checkInLat: 19.0658, checkInLng: 72.86865, checkInAccuracy: 10, workingMinutes: 310, breakMinutes: 25, overtimeMinutes: 0, isLate: true, isEarlyExit: false, source: 'AUTO_GEOFENCE', verificationStatus: 'VERIFIED', events: [] },
  { id: 'att_005_today', employeeId: 'emp_005', date: today, officeId: 'off_delhi_sales', shiftId: 'shift_general', status: 'ON_DUTY', checkInTime: '09:30 AM', checkInLat: 28.63152, checkInLng: 77.21668, checkInAccuracy: 14, workingMinutes: 420, breakMinutes: 45, overtimeMinutes: 0, isLate: false, isEarlyExit: false, source: 'MANUAL', verificationStatus: 'VERIFIED', clientVisit: { clientName: 'Tata Motors Corporate HQ', clientLocation: 'Barakhamba Road, Connaught Place, New Delhi', purpose: 'Enterprise Solution Demonstration & SLA Contract Discussion', timestamp: '09:30 AM', latitude: 28.63152, longitude: 77.21668 }, events: [] },
  { id: 'att_006_today', employeeId: 'emp_006', date: today, officeId: 'off_mumbai_hq', shiftId: 'shift_general', status: 'PRESENT', checkInTime: '09:40 AM', checkInLat: 19.06575, checkInLng: 72.8687, checkInAccuracy: 11, workingMinutes: 460, breakMinutes: 40, overtimeMinutes: 0, isLate: false, isEarlyExit: false, source: 'AUTO_GEOFENCE', verificationStatus: 'VERIFIED', events: [] },
  { id: 'att_007_today', employeeId: 'emp_007', date: today, officeId: 'off_mumbai_hq', shiftId: 'shift_general', status: 'PRESENT', checkInTime: '09:15 AM', checkInLat: 19.0656, checkInLng: 72.8688, checkInAccuracy: 16, workingMinutes: 485, breakMinutes: 45, overtimeMinutes: 0, isLate: false, isEarlyExit: false, source: 'AUTO_GEOFENCE', verificationStatus: 'VERIFIED', events: [] },
  { id: 'att_008_today', employeeId: 'emp_008', date: today, officeId: 'off_pune_hub', shiftId: 'shift_general', status: 'WFH', checkInTime: '10:00 AM', checkInLat: 18.5204, checkInLng: 73.8567, checkInAccuracy: 25, workingMinutes: 380, breakMinutes: 40, overtimeMinutes: 0, isLate: false, isEarlyExit: false, source: 'MANUAL', verificationStatus: 'VERIFIED', events: [] },
  { id: 'att_009_today', employeeId: 'emp_009', date: today, officeId: 'off_delhi_sales', shiftId: 'shift_general', status: 'ON_LEAVE', workingMinutes: 0, breakMinutes: 0, overtimeMinutes: 0, isLate: false, isEarlyExit: false, source: 'ADMIN', verificationStatus: 'VERIFIED', events: [] },
  { id: 'att_010_today', employeeId: 'emp_010', date: today, officeId: 'off_mumbai_hq', shiftId: 'shift_general', status: 'ABSENT', workingMinutes: 0, breakMinutes: 0, overtimeMinutes: 0, isLate: false, isEarlyExit: false, source: 'ADMIN', verificationStatus: 'VERIFIED', events: [] },
];

const leaves = [
  { id: 'leave_01', employeeId: 'emp_009', employeeName: 'Vikram Rathore', leaveType: 'CASUAL', startDate: '2026-09-27', endDate: '2026-09-28', daysCount: 2, isHalfDay: false, reason: 'Family wedding ceremony in Jaipur', status: 'APPROVED', appliedAt: '2026-09-24', approvedBy: 'Amitabh Verma' },
  { id: 'leave_02', employeeId: 'emp_003', employeeName: 'Rohan Deshmukh', leaveType: 'EARNED', startDate: '2026-10-02', endDate: '2026-10-06', daysCount: 5, isHalfDay: false, reason: 'Annual family festival & travel', status: 'PENDING', appliedAt: '2026-09-26' },
  { id: 'leave_03', employeeId: 'emp_008', employeeName: 'Ananya Roy', leaveType: 'SICK', startDate: '2026-09-29', endDate: '2026-09-29', daysCount: 1, isHalfDay: false, reason: 'Dental surgery follow-up', status: 'PENDING', appliedAt: '2026-09-26' },
];

const regularizations = [
  { id: 'reg_01', employeeId: 'emp_001', employeeName: 'Avanish Dhake', date: '2026-09-22', requestedCheckIn: '09:45 AM', requestedCheckOut: '06:15 PM', reason: 'Underground basement parking GPS signal attenuation delayed geo-packet transmission by 18 minutes.', status: 'PENDING', appliedAt: '2026-09-23' },
  { id: 'reg_02', employeeId: 'emp_004', employeeName: 'Kavita Patel', date: '2026-09-21', requestedCheckIn: '10:00 AM', requestedCheckOut: '06:30 PM', reason: 'Client meeting at HDFC Bank Head Office in morning before heading to BKC campus.', status: 'APPROVED', appliedAt: '2026-09-22' },
];

const expenses = [
  { id: 'exp_01', employeeId: 'emp_005', employeeName: 'Amitabh Verma', category: 'CLIENT_MEET', amount: 3450, date: '2026-09-25', description: 'Executive dinner with CIO of Tata Motors for ERP solution discussion', receiptName: 'Taj_Palace_Dinner_GST_Inv.pdf', status: 'PENDING' },
  { id: 'exp_02', employeeId: 'emp_001', employeeName: 'Avanish Dhake', category: 'TRAVEL', amount: 1250, date: '2026-09-24', description: 'Ola Corporate Cab: BKC Office to Vashi Data Center for hardware audit', receiptName: 'Ola_Corporate_Trip_48291.pdf', status: 'APPROVED' },
];

const auditLogs = [
  { id: 'aud_01', timestamp: '2026-09-27 09:48:05', actor: 'SYSTEM_GEOFENCE_ENGINE', role: 'Automated Service', action: 'AUTO_CHECK_IN', entity: 'Attendance', entityId: 'att_001_today', details: 'Verified geofence entry: Avanish Dhake at Mumbai HQ (Dist: 28m, Acc: ±12m)', ipAddress: '103.21.58.12' },
  { id: 'aud_02', timestamp: '2026-09-26 18:00:22', actor: 'Sneha Kulkarni', role: 'HR Manager', action: 'POLICY_UPDATE', entity: 'AttendancePolicy', entityId: 'policy_global', details: 'Configured Exit Grace Period from 5 minutes to 10 minutes to prevent false checkout flags', ipAddress: '14.143.19.102' },
  { id: 'aud_03', timestamp: '2026-09-26 15:42:10', actor: 'Amitabh Verma', role: 'Manager', action: 'LEAVE_APPROVE', entity: 'LeaveRequest', entityId: 'leave_01', details: 'Approved 2 days Casual Leave for Vikram Rathore', ipAddress: '122.161.49.201' },
];

const policy = {
  id: 'policy_global',
  geofenceRadiusMeters: 100,
  gpsAccuracyMaxMeters: 50,
  exitGracePeriodMinutes: 10,
  gracePeriodForLateMinutes: 15,
  lateMarkThresholdMinutes: 30,
  halfDayThresholdHours: 4.5,
  autoCheckoutTime: '09:00 PM',
  requireMockLocationCheck: true,
  allowOfflineAttendance: true,
};

async function seed() {
  await connectDB();

  await Promise.all([
    Office.deleteMany({}),
    Shift.deleteMany({}),
    Employee.deleteMany({}),
    AttendanceRecord.deleteMany({}),
    LeaveRequest.deleteMany({}),
    RegularizationRequest.deleteMany({}),
    ExpenseClaim.deleteMany({}),
    AuditLogEntry.deleteMany({}),
    AttendancePolicy.deleteMany({}),
  ]);

  await Office.insertMany(offices);
  await Shift.insertMany(shifts);
  await Employee.insertMany(employees);
  await AttendanceRecord.insertMany(attendance);
  await LeaveRequest.insertMany(leaves);
  await RegularizationRequest.insertMany(regularizations);
  await ExpenseClaim.insertMany(expenses);
  await AuditLogEntry.insertMany(auditLogs);
  await AttendancePolicy.create(policy);

  console.log('✅ Seed data inserted successfully');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
