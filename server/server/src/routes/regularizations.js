const express = require('express');
const router = express.Router();
const RegularizationRequest = require('../models/RegularizationRequest');

router.get('/', async (req, res) => {
  const regs = await RegularizationRequest.find().sort({ appliedAt: -1 });
  res.json(regs);
});

router.post('/', async (req, res) => {
  try {
    const reg = await RegularizationRequest.create({
      ...req.body,
      id: `reg_${Date.now()}`,
      status: 'PENDING',
      appliedAt: new Date().toISOString().slice(0, 10),
    });
    res.status(201).json(reg);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { status } = req.body; // 'APPROVED' | 'REJECTED'
  const reg = await RegularizationRequest.findOneAndUpdate(
    { id: req.params.id },
    { status },
    { new: true }
  );
  if (!reg) return res.status(404).json({ error: 'Regularization request not found' });
  res.json(reg);
});

module.exports = router;
