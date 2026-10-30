// GET /api/slip-download/:token — salary slip ka chhota (3 minute) download link.
// Jab phone me file-save plugin na ho, app is link ko phone ke browser me kholta hai aur wahan se download ho jata hai.
const express = require('express');
const router = express.Router();
const SalarySlip = require('../models/SalarySlip');
const { verify } = require('../utils/token');
const { runWithTenant } = require('../utils/tenant');

router.get('/:token', async (req, res) => {
  try {
    const p = verify(String(req.params.token || ''));
    if (!p || p.t !== 'slipdl' || !p.slipId || !p.companyId || !p.employeeId) {
      return res.status(401).send('Link expire ho gaya. App me wapas jaakar Download dobara dabao.');
    }
    const s = await runWithTenant(p.companyId, async () => await SalarySlip.findOne({ id: p.slipId, employeeId: p.employeeId }));
    if (!s) return res.status(404).send('Salary slip nahi mili');
    const ext = s.mimeType === 'application/pdf' ? 'pdf' : s.mimeType === 'image/png' ? 'png' : 'jpg';
    res.set({
      'Content-Type': s.mimeType,
      'Content-Length': s.data.length,
      'Content-Disposition': `attachment; filename="SalarySlip-${s.month}.${ext}"`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    res.send(s.data);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
