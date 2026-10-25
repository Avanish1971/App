// Admin ke liye: message bhejo (sabko ya chune hue employees ko) aur dekho kisne padha
const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Employee = require('../models/Employee');
const { sendToEmployee, broadcastEmployees, broadcastAdmin } = require('../utils/realtime');

const MAX_LEN = 1000;

// Message ko wahi dikhao jo employee ko jaana chahiye (employee ko doosron ki list nahi)
function forEmployee(m, employeeId) {
  return {
    id: m.id,
    text: m.text,
    fromName: m.fromName,
    sentAt: m.sentAt,
    toAll: m.toAll,
    read: (m.readBy || []).includes(employeeId),
  };
}

async function totalRecipients(m) {
  if (!m.toAll) return (m.recipientIds || []).length;
  return Employee.countDocuments({ status: { $ne: 'INACTIVE' } });
}

// GET /api/messages -> pichhle 100 messages + kitno ne padha
router.get('/', async (req, res) => {
  try {
    const list = await Message.find().sort({ sentAt: -1 }).limit(100).lean();
    const activeCount = await Employee.countDocuments({ status: { $ne: 'INACTIVE' } });
    res.json(list.map((m) => ({
      ...m,
      readCount: (m.readBy || []).length,
      totalCount: m.toAll ? activeCount : (m.recipientIds || []).length,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/messages  { text, recipientIds?: string[] }   (recipientIds khali/nahi = sabko)
router.post('/', async (req, res) => {
  try {
    const text = String((req.body && req.body.text) || '').trim();
    if (!text) return res.status(400).json({ error: 'Message khali hai' });
    if (text.length > MAX_LEN) return res.status(400).json({ error: `Message ${MAX_LEN} akshar se chhota rakho` });

    const ids = Array.isArray(req.body && req.body.recipientIds)
      ? [...new Set(req.body.recipientIds.map(String))]
      : [];
    const toAll = ids.length === 0;

    let recipients = [];
    if (!toAll) {
      recipients = await Employee.find({ id: { $in: ids }, status: { $ne: 'INACTIVE' } }, 'id fullName').lean();
      if (recipients.length === 0) return res.status(400).json({ error: 'Koi valid employee nahi mila' });
    }

    const doc = await Message.create({
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      text,
      toAll,
      recipientIds: recipients.map((e) => e.id),
      recipientNames: recipients.map((e) => e.fullName),
      readBy: [],
      sentAt: new Date().toISOString(),
    });
    const m = doc.toObject();

    // Turant employees ke phone par
    if (toAll) broadcastEmployees('message', forEmployee(m, ''));
    else recipients.forEach((e) => sendToEmployee(e.id, 'message', forEmployee(m, e.id)));

    const full = { ...m, readCount: 0, totalCount: await totalRecipients(m) };
    broadcastAdmin('message-sent', full); // doosri admin screens par bhi dikhe
    res.status(201).json(full);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.forEmployee = forEmployee;
