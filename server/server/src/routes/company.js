// /api/company
//   GET /public?code=XXXX   (bina login: login screen par company ka naam/logo)
//   GET /logo?code=XXXX     (bina login: logo image)
//   GET /                   (admin ya employee: apni company ki jaankari)
//   PUT /                   (sirf admin: naam / logo badalna)
const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const { requireRole } = require('../middleware/auth');

const LOGO_MIME = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_LOGO = 1024 * 1024; // 1 MB

const publicInfo = (c) => ({
  name: c.name || '',
  code: c.code,
  empPrefix: c.empPrefix || 'EMP',
  hasLogo: Boolean(c.logoData && c.logoData.length),
  updatedAt: c.updatedAt || '',
});

router.get('/public', async (req, res) => {
  try {
    const code = String(req.query.code || '').trim().toUpperCase();
    const c = code && (await Company.findOne({ code }));
    if (!c) return res.status(404).json({ error: 'Company nahi mili' });
    const { code: _omit, empPrefix, ...rest } = publicInfo(c);
    res.json(rest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/logo', async (req, res) => {
  try {
    const code = String(req.query.code || '').trim().toUpperCase();
    const c = code && (await Company.findOne({ code }));
    if (!c || !c.logoData || !c.logoData.length) return res.status(404).json({ error: 'Logo nahi hai' });
    res.set({
      'Content-Type': c.logoMime || 'image/png',
      'Content-Length': c.logoData.length,
      'Cache-Control': 'public, max-age=300',
      'X-Content-Type-Options': 'nosniff',
    });
    res.send(c.logoData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', requireRole('admin', 'employee'), async (req, res) => {
  try {
    const c = await Company.findOne({ id: req.auth.companyId });
    if (!c) return res.status(404).json({ error: 'Company nahi mili' });
    res.json(publicInfo(c));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT { name, logoBase64?, logoMime?, removeLogo? }
router.put('/', requireRole('admin'), express.json({ limit: '3mb' }), async (req, res) => {
  try {
    const b = req.body || {};
    const name = String(b.name || '').trim().slice(0, 120);
    if (!name) return res.status(400).json({ error: 'Company ka naam likho' });

    const c = await Company.findOne({ id: req.auth.companyId });
    if (!c) return res.status(404).json({ error: 'Company nahi mili' });
    c.name = name;
    if (b.removeLogo) {
      c.logoData = undefined;
      c.logoMime = undefined;
    } else if (b.logoBase64) {
      if (!LOGO_MIME.includes(b.logoMime)) return res.status(400).json({ error: 'Logo PNG, JPG ya WEBP hona chahiye' });
      const buf = Buffer.from(String(b.logoBase64).replace(/^data:[^;]+;base64,/, ''), 'base64');
      if (buf.length === 0 || buf.length > MAX_LOGO) return res.status(400).json({ error: 'Logo 1 MB se chhota hona chahiye' });
      c.logoData = buf;
      c.logoMime = b.logoMime;
    }
    c.updatedAt = new Date().toISOString();
    await c.save();
    res.json(publicInfo(c));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
