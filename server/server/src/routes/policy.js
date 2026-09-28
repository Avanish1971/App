const express = require('express');
const router = express.Router();
const AttendancePolicy = require('../models/AttendancePolicy');

// GET /api/policy - fetch the single global policy doc (creates a default one if missing)
router.get('/', async (req, res) => {
  let policy = await AttendancePolicy.findOne({ id: 'policy_global' });
  if (!policy) {
    policy = await AttendancePolicy.create({ id: 'policy_global' });
  }
  res.json(policy);
});

// PUT /api/policy - save updated policy
router.put('/', async (req, res) => {
  const policy = await AttendancePolicy.findOneAndUpdate(
    { id: 'policy_global' },
    req.body,
    { new: true, upsert: true }
  );
  res.json(policy);
});

module.exports = router;
