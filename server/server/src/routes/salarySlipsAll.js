// GET /api/salary-slips[?month=YYYY-MM] (sirf admin) — saare employees ki salary slips ki list (file ke bina).
// History tab me "kis mahine me kitni slip bani" dikhane ke liye.
const express = require('express');
const router = express.Router();
const SalarySlip = require('../models/SalarySlip');

router.get('/', async (req, res) => {
  try {
    const q = {};
    if (/^\d{4}-(0[1-9]|1[0-2])$/.test(String(req.query.month || ''))) q.month = req.query.month;
    const list = await SalarySlip.find(q, '-data').sort({ month: -1, uploadedAt: -1 }).lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
