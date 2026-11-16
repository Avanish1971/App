const express = require('express');
const router = express.Router();
const AttendanceRecord = require('../models/AttendanceRecord');
const { todayIST } = require('../utils/time');
const { processPing } = require('../utils/geofence');
const { broadcastAdmin } = require('../utils/realtime');
const Employee = require('../models/Employee');
const LeaveRequest = require('../models/LeaveRequest');
const { WEEKLY_OFF } = require('../utils/weeklyOff');

// GET /api/attendance?date=2026-10-14  -> us din ke saare records (default: aaj, IST)
router.get('/', async (req, res) => {
  try {
    const date = req.query.date || todayIST();
    res.json(await AttendanceRecord.find({ date }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/attendance/monthly/2026-10 -> us mahine ke saare employees ke saare records
// (NOTE: ye '/:employeeId' se PEHLE hona chahiye, warna "monthly" ko employee id samajh liya jayega)
router.get('/monthly/:month', async (req, res) => {
  try {
    const { month } = req.params;
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'Month format YYYY-MM hona chahiye' });
    }
    res.json(await AttendanceRecord.find({ date: { $regex: `^${month}-` } }).sort({ date: 1 }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/attendance/summary/2026-10 -> har employee ka mahine ka hisaab:
// kitne din aaya, late, half day, leave (approved), absent, total hours
// (NOTE: ye '/:employeeId' se PEHLE hona chahiye)
router.get('/summary/:month', async (req, res) => {
  try {
    const { month } = req.params;
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return res.status(400).json({ error: 'Month format YYYY-MM hona chahiye' });
    const monthStart = `${month}-01`;
    const monthEnd = `${month}-31`; // string compare ke liye kaafi

    const [employees, records, leaves] = await Promise.all([
      Employee.find({}, 'id status').lean(),
      AttendanceRecord.find({ date: { $regex: `^${month}-` } }).lean(),
      LeaveRequest.find({ status: 'APPROVED', startDate: { $lte: monthEnd }, endDate: { $gte: monthStart } }).lean(),
    ]);

    const CAME = ['PRESENT', 'ON_DUTY', 'HALF_DAY', 'CHECKED_OUT', 'ON_BREAK'];
    const out = new Map(
      employees.map((e) => [e.id, { employeeId: e.id, came: 0, late: 0, half: 0, absent: 0, leave: 0, minutes: 0, outMinutes: 0 }])
    );

    for (const r of records) {
      const row = out.get(r.employeeId);
      if (!row) continue;
      const came = Boolean(r.checkInTime) || CAME.includes(r.status);
      if (came) row.came += 1;
      if (came && r.isLate) row.late += 1; // late sirf unka jo aaye the
      if (r.status === 'HALF_DAY') row.half += 1;
      if (r.status === 'ABSENT') row.absent += 1;
      row.minutes += r.workingMinutes || 0;
      row.outMinutes += r.totalOutMinutes || 0;
    }

    // Approved leave ke din (sirf is mahine ke, weekly off chhod kar)
    for (const l of leaves) {
      const row = out.get(l.employeeId);
      if (!row) continue;
      const from = l.startDate > monthStart ? l.startDate : monthStart;
      const to = l.endDate < monthEnd ? l.endDate : monthEnd;
      let days = 0;
      for (let d = new Date(`${from}T00:00:00Z`), end = new Date(`${to}T00:00:00Z`), i = 0; d <= end && i < 32; d.setUTCDate(d.getUTCDate() + 1), i += 1) {
        if (d.toISOString().slice(0, 7) !== month) continue;
        if (!WEEKLY_OFF.includes(d.getUTCDay())) days += 1;
      }
      row.leave += l.isHalfDay && l.startDate === l.endDate ? Math.min(days, 1) * 0.5 : days;
    }

    res.json([...out.values()]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/attendance/:employeeId -> ek employee ki poori history
router.get('/:employeeId', async (req, res) => {
  try {
    res.json(await AttendanceRecord.find({ employeeId: req.params.employeeId }).sort({ date: -1 }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/attendance/:employeeId/today -> aaj ka record save (manual check-in, break, client visit)
router.put('/:employeeId/today', async (req, res) => {
  try {
    const date = todayIST();
    const update = { ...req.body, employeeId: req.params.employeeId, date };
    // Ye fields server khud sambhalta hai, purana app-copy inhe overwrite na kare
    ['_id', 'createdAt', 'updatedAt', 'outsideSince', 'lastPingAt', 'lastLat', 'lastLng',
      'lastDistanceMeters', 'insideGeofence', 'clientVisit', 'clientVisits'].forEach((k) => delete update[k]);
    const record = await AttendanceRecord.findOneAndUpdate(
      { employeeId: req.params.employeeId, date },
      update,
      { new: true, upsert: true }
    );
    broadcastAdmin('attendance', { record: record.toObject() });
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/attendance/:employeeId/location-ping -> app ki live location (auto present/absent)
router.post('/:employeeId/location-ping', async (req, res) => {
  try {
    res.json(await processPing(req.params.employeeId, req.body));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;