const express = require('express');
const router = express.Router();
const ExpenseClaim = require('../models/ExpenseClaim');

router.get('/', async (req, res) => {
  const expenses = await ExpenseClaim.find().sort({ date: -1 });
  res.json(expenses);
});

router.post('/', async (req, res) => {
  try {
    const expense = await ExpenseClaim.create({
      ...req.body,
      id: `exp_${Date.now()}`,
      status: 'PENDING',
    });
    res.status(201).json(expense);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { status } = req.body; // 'APPROVED' | 'REJECTED'
  const expense = await ExpenseClaim.findOneAndUpdate(
    { id: req.params.id },
    { status },
    { new: true }
  );
  if (!expense) return res.status(404).json({ error: 'Expense claim not found' });
  res.json(expense);
});

module.exports = router;
