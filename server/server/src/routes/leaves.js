const express = require('express');
const router = express.Router();
const LeaveRequest = require('../models/LeaveRequest');
const Employee = require('../models/Employee');
const { LEAVE_TYPES, LEAVE_LABELS, countLeaveDays, getBalance } = require('../utils/leaveBalance');
const { todayIST } = require('../utils/time');
const { sendToEmployee } = require('../utils/realtime');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

router.get('/', async (req, res) => {
  try {
    const leaves = await LeaveRequest.find().sort({ appliedAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/leaves - leave apply. Din server khud ginta hai aur bachi hui leave se zyada nahi maangne deta.
router.post('/', async (req, res) => {
  try {
    const b = req.body || {};
    const employee = await Employee.findOne({ id: b.employeeId });
    if (!employee) return res.status(400).json({ error: 'Employee nahi mila' });
    if (!LEAVE_TYPES.includes(b.leaveType)) return res.status(400).json({ error: 'Leave type galat hai' });

    const start = String(b.startDate || '');
    const end = String(b.endDate || b.startDate || '');
    if (!DATE_RE.test(start) || !DATE_RE.test(end)) return res.status(400).json({ error: 'Date sahi nahi hai' });
    if (end < start) return res.status(400).json({ error: 'End date, start date se pehle nahi ho sakti' });

    const isHalfDay = Boolean(b.isHalfDay);
    if (isHalfDay && start !== end) return res.status(400).json({ error: 'Half day sirf ek din ki leave me ho sakta hai' });

    const days = countLeaveDays(start, end, isHalfDay);
    if (days <= 0) return res.status(400).json({ error: 'Chuni hui date weekly off hai, leave ki zaroorat nahi' });

    const clash = await LeaveRequest.findOne({
      employeeId: employee.id,
      status: { $in: ['PENDING', 'APPROVED'] },
      startDate: { $lte: end },
      endDate: { $gte: start },
    });
    if (clash) return res.status(400).json({ error: 'In dino me pehle se leave apply/approve hai' });

    const { balances } = await getBalance(employee, start.slice(0, 4));
    const left = balances[b.leaveType].remaining;
    if (days > left) {
      return res.status(400).json({
        error: `${LEAVE_LABELS[b.leaveType]} leave kam hai: ${fmt(left)} bachi hai, aapne ${fmt(days)} maangi`,
      });
    }

    const leave = await LeaveRequest.create({
      id: `leave_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      employeeId: employee.id,
      employeeName: employee.fullName,
      leaveType: b.leaveType,
      startDate: start,
      endDate: end,
      daysCount: days,
      isHalfDay,
      reason: String(b.reason || '').slice(0, 500),
      status: 'PENDING',
      appliedAt: todayIST(),
    });
    res.status(201).json(leave);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/leaves/:id - approve ya reject
router.put('/:id', async (req, res) => {
  try {
    const { status, approvedBy } = req.body || {};
    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return res.status(400).json({ error: 'status galat hai' });
    }
    const existing = await LeaveRequest.findOne({ id: req.params.id });
    if (!existing) return res.status(404).json({ error: 'Leave request not found' });

    // Reject ki hui leave dobara approve ho to bhi quota se bahar nahi jaani chahiye
    if (status !== 'REJECTED') {
      const employee = await Employee.findOne({ id: existing.employeeId });
      if (employee) {
        const { balances } = await getBalance(employee, String(existing.startDate).slice(0, 4), existing.id);
        const left = balances[existing.leaveType].remaining;
        if ((existing.daysCount || 0) > left) {
          return res.status(400).json({ error: `${LEAVE_LABELS[existing.leaveType]} leave quota me ${fmt(left)} din hi bache hain` });
        }
      }
    }

    existing.status = status;
    existing.approvedBy = approvedBy;
    await existing.save();
    sendToEmployee(existing.employeeId, 'leave-updated', { id: existing.id, status }); // employee ka balance turant update
    res.json(existing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
