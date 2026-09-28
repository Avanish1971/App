const express = require('express');
const router = express.Router();
const AuditLogEntry = require('../models/AuditLogEntry');

router.get('/', async (req, res) => {
  const logs = await AuditLogEntry.find().sort({ timestamp: -1 }).limit(500);
  res.json(logs);
});

// Helper used internally by other routes to write an audit trail entry.
// Also exposed as POST /api/audit-logs if the frontend wants to log something directly.
router.post('/', async (req, res) => {
  try {
    const log = await AuditLogEntry.create({
      ...req.body,
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    });
    res.status(201).json(log);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
