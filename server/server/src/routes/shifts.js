// GET /api/shifts -> sirf do standard shift (First / Second) + wo purani shifts jo kisi employee par abhi bhi laagu hain
const express = require('express');
const router = express.Router();
const Shift = require('../models/Shift');
const Employee = require('../models/Employee');
const { ensureDefaultShifts, DEFAULT_SHIFT_IDS } = require('../utils/defaultShifts');

router.get('/', async (req, res) => {
  try {
    await ensureDefaultShifts();
    const [shifts, usedIds] = await Promise.all([Shift.find().lean(), Employee.distinct('shiftId')]);
    const keep = new Set([...DEFAULT_SHIFT_IDS, ...usedIds]);
    const rank = (id) => {
      const i = DEFAULT_SHIFT_IDS.indexOf(id);
      return i === -1 ? 99 : i;
    };
    res.json(shifts.filter((s) => keep.has(s.id)).sort((a, b) => rank(a.id) - rank(b.id)));
  } catch (error) {
    res.status(500).json({ error: error.message, message: error.message });
  }
});

module.exports = router;
