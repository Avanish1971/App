// Office ke departments (dropdown me isi order me dikhte hain)
export const DEPARTMENTS: string[] = [
  'Chief Executive Officer',
  'Establishment Department',
  'Divisional Management',
  'Accounts Department',
  'Proceedings Department',
  'Audit Department',
  'Loan Department',
  'Recovery Department',
  'Legal Recovery Department',
  'Stationery Department / Shares Department',
  'IT Department',
  'Call Center',
  'LIC Department',
  'Inward-Outward Department',
  'Warehouse Management',
  'Branch Management',
'Clerk',
  'Peon',
  'Cashier',
];

// Sirf do shift (dropdown me hamesha yahi do, baaki kuch nahi)
export const STANDARD_SHIFTS = [
  { id: 'shift_first', name: 'First Shift', startTime: '08:00 AM', endTime: '02:00 PM' },
  { id: 'shift_second', name: 'Second Shift', startTime: '02:00 PM', endTime: '08:00 PM' },
];
export const STANDARD_SHIFT_IDS = STANDARD_SHIFTS.map((s) => s.id);

// Dropdown ke liye: hamesha sirf First aur Second shift. Server se mili shift ka time (agar admin ne badla ho) use hota hai.
export function standardShiftOptions<T extends { id: string; name: string; startTime: string; endTime: string }>(shifts: T[]) {
  return STANDARD_SHIFTS.map((std) => shifts.find((s) => s.id === std.id) ?? std);
}

