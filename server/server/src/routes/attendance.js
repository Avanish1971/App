const express = require('express');
const router = express.Router();
const AttendanceRecord = require('../models/AttendanceRecord');
const { todayIST } = require('../utils/time');
const { processPing } = require('../utils/geofence');
const { broadcastAdmin } = require('../utils/realtime');

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