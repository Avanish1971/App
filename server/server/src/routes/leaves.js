const express = require('express');
const router = express.Router();
const LeaveRequest = require('../models/LeaveRequest');

router.get('/', async (req, res) => {
  const leaves = await LeaveRequest.find().sort({ appliedAt: -1 });
  res.json(leaves);
});

// POST /api/leaves - apply for leave
router.post('/', async (req, res) => {
  try {
    const leave = await LeaveRequest.create({
      ...req.body,
      id: `leave_${Date.now()}`,
      status: 'PENDING',
      appliedAt: new Date().toISOString().slice(0, 10),
    });
    res.status(201).json(leave);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/leaves/:id - approve or reject
router.put('/:id', async (req, res) => {
  const { status, approvedBy } = req.body; // 'APPROVED' | 'REJECTED'
  const leave = await LeaveRequest.findOneAndUpdate(
    { id: req.params.id },
    { status, approvedBy },
    { new: true }
  );
  if (!leave) return res.status(404).json({ error: 'Leave request not found' });
  res.json(leave);
});

module.exports = router;
