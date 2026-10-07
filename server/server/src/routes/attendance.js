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
const AttendanceRecord = require('../models/AttendanceRecord'); // आपके मॉडल का नाम

// 🔴 सबसे ज़रूरी चेक: रास्ता केवल '/' होना चाहिए, '/api/attendance' नहीं!
router.get('/', async (req, res) => {
  try {
    const records = await AttendanceRecord.find();
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;