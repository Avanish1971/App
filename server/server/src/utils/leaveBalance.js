// Fix leave quota aur balance: quota - (approved + pending) = bachi hui leave
const LeaveRequest = require('../models/LeaveRequest');
const { WEEKLY_OFF } = require('./weeklyOff');

const DEFAULT_QUOTA = { CASUAL: 12, SICK: 10, EARNED: 15 };
const LEAVE_TYPES = Object.keys(DEFAULT_QUOTA);
const LEAVE_LABELS = { CASUAL: 'Casual', SICK: 'Sick', EARNED: 'Earned' };

function quotaFor(employee) {
  const q = (employee && employee.leaveQuota) || {};
  const out = {};
  LEAVE_TYPES.forEach((t) => {
    out[t] = Number.isFinite(q[t]) ? q[t] : DEFAULT_QUOTA[t];
  });
  return out;
}

// start..end (dono din shaamil) me kitne kaam ke din hain (weekly off nahi ginte)
function countLeaveDays(start, end, isHalfDay) {
  const s = new Date(`${start}T00:00:00Z`);
  const e = new Date(`${end}T00:00:00Z`);
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 0;
  let days = 0;
  for (let d = new Date(s), i = 0; d <= e && i < 366; d.setUTCDate(d.getUTCDate() + 1), i += 1) {
    if (!WEEKLY_OFF.includes(d.getUTCDay())) days += 1;
  }
  if (isHalfDay) return start === end && days === 1 ? 0.5 : 0;
  return days;
}

async function getBalance(employee, year, excludeLeaveId) {
  const quota = quotaFor(employee);
  const query = {
    employeeId: employee.id,
    status: { $in: ['APPROVED', 'PENDING'] },
    startDate: { $regex: `^${year}-` },
  };
  if (excludeLeaveId) query.id = { $ne: excludeLeaveId };
  const leaves = await LeaveRequest.find(query).lean();

  const balances = {};
  LEAVE_TYPES.forEach((t) => {
    const mine = leaves.filter((l) => l.leaveType === t);
    const used = mine.filter((l) => l.status === 'APPROVED').reduce((a, l) => a + (l.daysCount || 0), 0);
    const pending = mine.filter((l) => l.status === 'PENDING').reduce((a, l) => a + (l.daysCount || 0), 0);
    balances[t] = { total: quota[t], used, pending, remaining: Math.max(0, quota[t] - used - pending) };
  });
  return { year: String(year), balances };
}

module.exports = { DEFAULT_QUOTA, LEAVE_TYPES, LEAVE_LABELS, quotaFor, countLeaveDays, getBalance };
