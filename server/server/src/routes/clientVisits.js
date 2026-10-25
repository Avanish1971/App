// /api/client-visits (sirf admin): field employees ke visits aur unki photos
const express = require('express');
const router = express.Router();
const ClientVisit = require('../models/ClientVisit');
const { todayIST } = require('../utils/time');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/client-visits?date=2026-10-24  |  ?from=&to=  |  &employeeId=emp_001
router.get('/', async (req, res) => {
  try {
    const { date, from, to, employeeId } = req.query;
    const q = {};
    if (employeeId) q.employeeId = String(employeeId);
    if (DATE_RE.test(String(from || '')) && DATE_RE.test(String(to || ''))) q.date = { $gte: from, $lte: to };
    else q.date = DATE_RE.test(String(date || '')) ? date : todayIST();

    const list = await ClientVisit.find(q, '-selfieData -siteData').sort({ visitedAt: -1 }).limit(300).lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/client-visits/:id/photo/selfie|site
router.get('/:id/photo/:kind', async (req, res) => {
  try {
    const kind = req.params.kind;
    if (!['selfie', 'site'].includes(kind)) return res.status(400).json({ error: 'kind galat hai' });
    const v = await ClientVisit.findOne({ id: req.params.id });
    const data = v && (kind === 'selfie' ? v.selfieData : v.siteData);
    if (!data) return res.status(404).json({ error: 'Photo nahi mili' });
    res.set({
      'Content-Type': (kind === 'selfie' ? v.selfieMime : v.siteMime) || 'image/jpeg',
      'Content-Length': data.length,
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    });
    res.send(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
