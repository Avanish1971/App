// const express = require('express');
// const router = express.Router();
// const Office = require('../models/Office');

// router.get('/', async (req, res) => {
//   const offices = await Office.find();
//   res.json(offices);
// });

// // PUT /api/offices/:id/radius - update geofence radius
// router.put('/:id/radius', async (req, res) => {
//   const { radiusMeters } = req.body;
//   const office = await Office.findOneAndUpdate(
//     { id: req.params.id },
//     { radiusMeters },
//     { new: true }
//   );
//   if (!office) return res.status(404).json({ error: 'Office not found' });
//   res.json(office);
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const Office = require('../models/Office');
const Employee = require('../models/Employee');
const AuditLogEntry = require('../models/AuditLogEntry');

// Form se aayi value ko check karke saaf data banata hai
function parseOffice(body) {
  const name = String((body && body.name) || '').trim();
  const lat = Number(body && body.latitude);
  const lng = Number(body && body.longitude);
  const radius = Number(body && body.radiusMeters);
  if (!name) return { error: 'Office ka naam zaroori hai' };
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) return { error: 'Latitude -90 se 90 ke beech honi chahiye' };
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) return { error: 'Longitude -180 se 180 ke beech honi chahiye' };
  if (!Number.isFinite(radius) || radius < 20 || radius > 1000) return { error: 'Radius 20 se 1000 meter ke beech rakho' };
  return {
    data: {
      name,
      city: String(body.city || '').trim(),
      address: String(body.address || '').trim(),
      latitude: lat,
      longitude: lng,
      radiusMeters: Math.round(radius),
      workingHours: String(body.workingHours || '').trim(),
    },
  };
}

async function audit(action, office, details) {
  try {
    await AuditLogEntry.create({
      id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' }),
      actor: 'Admin Console',
      role: 'Admin',
      action,
      entity: 'Office',
      entityId: office.id,
      details,
      ipAddress: '-',
    });
  } catch (e) {
    // audit fail ho to bhi office ka kaam rukna nahi chahiye
  }
}

// GET /api/offices  (activeEmployeeCount asli employees se gina jata hai)
router.get('/', async (req, res) => {
  try {
    const offices = await Office.find().lean();
    const counts = await Employee.aggregate([
      { $match: { status: 'ACTIVE' } },
      { $group: { _id: '$officeId', n: { $sum: 1 } } },
    ]);
    const byOffice = Object.fromEntries(counts.map((c) => [c._id, c.n]));
    res.json(offices.map((o) => ({ ...o, activeEmployeeCount: byOffice[o.id] || 0 })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/offices  -> naya office / location add
router.post('/', async (req, res) => {
  try {
    const parsed = parseOffice(req.body);
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    const office = await Office.create({
      id: `off_${Date.now()}`,
      ...parsed.data,
      allowedDepartments: [],
      activeEmployeeCount: 0,
    });
    await audit('OFFICE_CREATE', office, `Naya office add: ${office.name} (${office.latitude}, ${office.longitude}) radius ${office.radiusMeters}m`);
    res.status(201).json(office);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/offices/:id/radius -> sirf radius badalna (Live Radar ka slider)
router.put('/:id/radius', async (req, res) => {
  try {
    const radius = Number(req.body && req.body.radiusMeters);
    if (!Number.isFinite(radius) || radius < 20 || radius > 1000) {
      return res.status(400).json({ error: 'Radius 20 se 1000 meter ke beech rakho' });
    }
    const office = await Office.findOneAndUpdate({ id: req.params.id }, { radiusMeters: Math.round(radius) }, { new: true });
    if (!office) return res.status(404).json({ error: 'Office nahi mila' });
    res.json(office);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/offices/:id -> office ki poori detail edit
router.put('/:id', async (req, res) => {
  try {
    const parsed = parseOffice(req.body);
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    const office = await Office.findOneAndUpdate({ id: req.params.id }, parsed.data, { new: true });
    if (!office) return res.status(404).json({ error: 'Office nahi mila' });
    await audit('OFFICE_UPDATE', office, `Office update: ${office.name} (${office.latitude}, ${office.longitude}) radius ${office.radiusMeters}m`);
    res.json(office);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/offices/:id -> sirf tab jab koi employee us office se juda na ho
router.delete('/:id', async (req, res) => {
  try {
    const assigned = await Employee.countDocuments({ officeId: req.params.id });
    if (assigned > 0) {
      return res.status(409).json({ error: `Is office se ${assigned} employee juda hai. Pehle unka office badlo, phir delete karo.` });
    }
    const office = await Office.findOneAndDelete({ id: req.params.id });
    if (!office) return res.status(404).json({ error: 'Office nahi mila' });
    await audit('OFFICE_DELETE', office, `Office delete: ${office.name}`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
