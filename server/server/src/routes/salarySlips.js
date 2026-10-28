// /api/employees/:id/salary-slips (sirf admin) — salary slip upload / dekhna / hatana
const express = require('express');
const router = express.Router({ mergeParams: true });
const Employee = require('../models/Employee');
const SalarySlip = require('../models/SalarySlip');
const Message = require('../models/Message');
const { sendToEmployee } = require('../utils/realtime');

const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

router.get('/', async (req, res) => {
  try {
    const list = await SalarySlip.find({ employeeId: req.params.id }, '-data').sort({ month: -1 }).lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST { month: '2026-10', fileName, mimeType, dataBase64 }
router.post('/', async (req, res) => {
  try {
    const emp = await Employee.findOne({ id: req.params.id });
    if (!emp) return res.status(404).json({ error: 'Employee nahi mila' });

    const { month, fileName, mimeType, dataBase64 } = req.body || {};
    if (!MONTH_RE.test(String(month || ''))) return res.status(400).json({ error: 'Mahina chuno' });
    if (!ALLOWED_MIME.includes(mimeType)) return res.status(400).json({ error: 'Sirf PDF, JPG ya PNG file allowed hai' });
    const buf = Buffer.from(String(dataBase64 || '').replace(/^data:[^;]+;base64,/, ''), 'base64');
    if (buf.length === 0) return res.status(400).json({ error: 'File khali hai' });
    if (buf.length > MAX_BYTES) return res.status(400).json({ error: 'File 3 MB se badi hai' });

    const existed = await SalarySlip.findOne({ employeeId: emp.id, month }, 'id');
    const doc = await SalarySlip.findOneAndUpdate(
      { employeeId: emp.id, month },
      {
        $set: { fileName: String(fileName || 'salary-slip').slice(0, 200), mimeType, size: buf.length, data: buf, uploadedAt: new Date().toISOString() },
        $setOnInsert: { id: `slip_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` },
      },
      { upsert: true, new: true }
    );

    // Employee ko turant batao (naye upload par)
    if (!existed) {
      const [y, m] = month.split('-');
      const msg = await Message.create({
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        text: `${MONTH_NAMES[Number(m) - 1]} ${y} ki salary slip upload ho gayi hai. Profile → Salary Slip me dekho aur download karo.`,
        toAll: false,
        recipientIds: [emp.id],
        recipientNames: [emp.fullName],
        readBy: [],
        sentAt: new Date().toISOString(),
      });
      const m2 = msg.toObject();
      sendToEmployee(emp.id, 'message', { id: m2.id, text: m2.text, fromName: m2.fromName, sentAt: m2.sentAt, toAll: false, read: false });
    }

    const { data, ...meta } = doc.toObject();
    res.status(201).json(meta);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:slipId/file', async (req, res) => {
  try {
    const s = await SalarySlip.findOne({ id: req.params.slipId, employeeId: req.params.id });
    if (!s) return res.status(404).json({ error: 'Salary slip nahi mili' });
    res.set({ 'Content-Type': s.mimeType, 'Content-Length': s.data.length, 'X-Content-Type-Options': 'nosniff' });
    res.send(s.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:slipId', async (req, res) => {
  try {
    const r = await SalarySlip.deleteOne({ id: req.params.slipId, employeeId: req.params.id });
    if (!r.deletedCount) return res.status(404).json({ error: 'Salary slip nahi mili' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
