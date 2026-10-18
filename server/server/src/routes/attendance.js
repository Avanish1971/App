// const express = require('express');
// const router = express.Router();
// const AttendanceRecord = require('../models/AttendanceRecord');

// // GET /api/attendance?date=2026-09-27 - all records for a day (default: today)
// router.get('/', async (req, res) => {
//   const date = req.query.date || new Date().toISOString().slice(0, 10);
//   const records = await AttendanceRecord.find({ date });
//   res.json(records);
// });

// // GET /api/attendance/:employeeId - full history for one employee
// router.get('/:employeeId', async (req, res) => {
//   const records = await AttendanceRecord.find({ employeeId: req.params.employeeId }).sort({ date: -1 });
//   res.json(records);
// });

// // PUT /api/attendance/:employeeId/today - upsert today's record (check-in, break toggle, etc.)
// // Body = the full updated AttendanceRecord object from the frontend
// router.put('/:employeeId/today', async (req, res) => {
//   const date = new Date().toISOString().slice(0, 10);
//   const update = { ...req.body, employeeId: req.params.employeeId, date };
//   const record = await AttendanceRecord.findOneAndUpdate(
//     { employeeId: req.params.employeeId, date },
//     update,
//     { new: true, upsert: true }
//   );
//   res.json(record);
// });

// module.exports = router;


const express = require('express');
const router = express.Router();
const AttendanceRecord = require('../models/AttendanceRecord');
const { todayIST } = require('../utils/time');
const { processPing } = require('../utils/geofence');

// GET /api/attendance?date=2026-10-14  -> us din ke saare records (default: aaj, IST)
router.get('/', async (req, res) => {
  try {
    const date = req.query.date || todayIST();
    res.json(await AttendanceRecord.find({ date }));
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
      'lastDistanceMeters', 'insideGeofence'].forEach((k) => delete update[k]);
    const record = await AttendanceRecord.findOneAndUpdate(
      { employeeId: req.params.employeeId, date },
      update,
      { new: true, upsert: true }
    );
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