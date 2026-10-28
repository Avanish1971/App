// GET /api/photos/:token — profile photo dikhane ke liye (login ke bina, kyunki <img> header nahi bhej sakta).
// Token 128-bit random hai, isliye link kisi ko guess nahi ho sakta.
const express = require('express');
const router = express.Router();
const EmployeePhoto = require('../models/EmployeePhoto');
const { runUnscoped } = require('../utils/tenant');

router.get('/:token', async (req, res) => {
  try {
    const token = String(req.params.token || '');
    if (!/^[a-f0-9]{32}$/.test(token)) return res.status(404).end();
    const p = await runUnscoped(async () => await EmployeePhoto.findOne({ token }));
    if (!p) return res.status(404).end();
    res.set({
      'Content-Type': p.mimeType || 'image/jpeg',
      'Content-Length': p.data.length,
      'Cache-Control': 'public, max-age=31536000, immutable', // photo badle to token badal jata hai
      'X-Content-Type-Options': 'nosniff',
    });
    res.send(p.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
