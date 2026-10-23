const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const Office = require('../models/Office');
const Shift = require('../models/Shift');
const AttendanceRecord = require('../models/AttendanceRecord');
const LeaveRequest = require('../models/LeaveRequest');
const { todayIST } = require('../utils/time');

// GET /api/me -> login kiye hue employee ka apna data (doosron ka kuch nahi, password bhi nahi)
router.get('/', async (req, res) => {
  try {
    const emp = await Employee.findOne({ id: req.auth.employeeId }).lean();
    if (!emp) return res.status(401).json({ error: 'Aapka account ab maujood nahi hai' });
    if (emp.status === 'INACTIVE') return res.status(403).json({ error: 'Aapki ID band (deactivate) hai. HR se baat karo.' });
    delete emp.password;

    const [office, shift, attendance, leaves] = await Promise.all([
      Office.findOne({ id: emp.officeId }).lean(),
      Shift.findOne({ id: emp.shiftId }).lean(),
      AttendanceRecord.findOne({ employeeId: emp.id, date: todayIST() }).lean(),
      LeaveRequest.find({ employeeId: emp.id }).sort({ appliedAt: -1 }).lean(),
    ]);
    res.json({ employee: emp, office: office || null, shift: shift || null, attendance: attendance || null, leaves });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
