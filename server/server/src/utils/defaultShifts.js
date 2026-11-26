// Har company ke liye sirf do standard shift: First (8 AM - 2 PM) aur Second (2 PM - 8 PM).
// Company me ye do shift na ho to apne aap ban jaati hain (tenant context me chalana hai).
const Shift = require('../models/Shift');

const COMMON = { breakDurationMinutes: 30, gracePeriodMinutes: 15, lateThresholdMinutes: 30, earlyCheckoutMinutes: 30, isOvernight: false };

const DEFAULT_SHIFTS = [
  { id: 'shift_first', name: 'First Shift', startTime: '08:00 AM', endTime: '02:00 PM', ...COMMON },
  { id: 'shift_second', name: 'Second Shift', startTime: '02:00 PM', endTime: '08:00 PM', ...COMMON },
];
const DEFAULT_SHIFT_IDS = DEFAULT_SHIFTS.map((s) => s.id);

async function ensureDefaultShifts() {
  for (const s of DEFAULT_SHIFTS) {
    // $setOnInsert: pehle se hai (aur admin ne time badla hai) to chhedta nahi
    await Shift.updateOne({ id: s.id }, { $setOnInsert: s }, { upsert: true });
  }
}

module.exports = { DEFAULT_SHIFTS, DEFAULT_SHIFT_IDS, ensureDefaultShifts };
