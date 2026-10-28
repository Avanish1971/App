const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const Office = require('../models/Office');
const Shift = require('../models/Shift');
const AttendanceRecord = require('../models/AttendanceRecord');
const LeaveRequest = require('../models/LeaveRequest');
const Message = require('../models/Message');
const ClientVisit = require('../models/ClientVisit');
const SalarySlip = require('../models/SalarySlip');
const { forEmployee } = require('./messages');
const { todayIST, nowTimeIST } = require('../utils/time');
const { getBalance } = require('../utils/leaveBalance');
const { broadcastAdmin } = require('../utils/realtime');

// GET /api/me -> login kiye hue employee ka apna data (doosron ka kuch nahi, password bhi nahi)
router.get('/', async (req, res) => {
  try {
    const emp = await Employee.findOne({ id: req.auth.employeeId }).lean();
    if (!emp) return res.status(401).json({ error: 'Aapka account ab maujood nahi hai' });
    if (emp.status === 'INACTIVE') return res.status(403).json({ error: 'Aapki ID band (deactivate) hai. HR se baat karo.' });
    delete emp.password;

    const [office, shift, attendance, leaves] = await Promise.all([
      Office.findOne({ id: emp.officeId }).lean(),
      Shift.findOne({ id: emp.shiftId }).lean(),
      AttendanceRecord.findOne({ employeeId: emp.id, date: todayIST() }).lean(),
      LeaveRequest.find({ employeeId: emp.id }).sort({ appliedAt: -1 }).lean(),
    ]);
    // Leave balance me kuch bhi gadbad ho to bhi attendance wala app load hona nahi rukna chahiye
    const leaveBalance = await getBalance(emp, todayIST().slice(0, 4)).catch(() => null);
    res.json({ employee: emp, office: office || null, shift: shift || null, attendance: attendance || null, leaves, leaveBalance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/me/client-visits -> field employee ka client visit (live location + selfie + jagah ki photo + wajah + client info)
const PHOTO_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PHOTO = 2 * 1024 * 1024;
function readPhoto(b64, mime) {
  if (!PHOTO_MIME.includes(mime)) return null;
  const buf = Buffer.from(String(b64 || '').replace(/^data:[^;]+;base64,/, ''), 'base64');
  return buf.length > 0 && buf.length <= MAX_PHOTO ? buf : null;
}

router.post('/client-visits', async (req, res) => {
  try {
    const emp = await Employee.findOne({ id: req.auth.employeeId });
    if (!emp || emp.status === 'INACTIVE') return res.status(403).json({ error: 'Aapki ID band hai' });
    if (emp.workType !== 'FIELD_WORK') {
      return res.status(403).json({ error: 'Client visit sirf Field Work wale employee ke liye hai' });
    }

    const b = req.body || {};
    const clean = (v, max) => String(v || '').trim().slice(0, max);
    const clientName = clean(b.clientName, 150);
    const clientLocation = clean(b.clientLocation, 300);
    const purpose = clean(b.purpose, 600);
    const contactPerson = clean(b.contactPerson, 100);
    const contactPhone = clean(b.contactPhone, 20);
    if (!clientName || !clientLocation) return res.status(400).json({ error: 'Client ka naam aur jagah (address) likhna zaroori hai' });
    if (!purpose) return res.status(400).json({ error: 'Kyu gaye the (wajah) likhna zaroori hai' });

    const latitude = Number(b.latitude);
    const longitude = Number(b.longitude);
    const accuracy = Number(b.accuracy) || 0;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      return res.status(400).json({ error: 'Live location nahi mili. GPS on karke dobara try karo' });
    }

    const selfie = readPhoto(b.selfieBase64, b.selfieMime);
    const site = readPhoto(b.sitePhotoBase64, b.sitePhotoMime);
    if (!selfie) return res.status(400).json({ error: 'Apni selfie lena zaroori hai (JPG/PNG, max 2 MB)' });
    if (!site) return res.status(400).json({ error: 'Jis jagah gaye ho uski photo lena zaroori hai (JPG/PNG, max 2 MB)' });

    const date = todayIST();
    const time = nowTimeIST();
    const visit = await ClientVisit.create({
      id: `visit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      employeeId: emp.id,
      employeeName: emp.fullName,
      date,
      time,
      clientName,
      clientLocation,
      contactPerson,
      contactPhone,
      purpose,
      latitude,
      longitude,
      accuracy,
      selfieData: selfie,
      selfieMime: b.selfieMime,
      siteData: site,
      siteMime: b.sitePhotoMime,
      visitedAt: new Date().toISOString(),
    });

    // Aaj ki attendance: On-Duty (field staff ki gair-hazri nahi lagti)
    let rec = await AttendanceRecord.findOne({ employeeId: emp.id, date });
    if (!rec) {
      rec = new AttendanceRecord({
        id: `att_${emp.id}_${date}`,
        employeeId: emp.id,
        date,
        officeId: emp.officeId,
        shiftId: emp.shiftId,
      });
    }
    rec.status = 'ON_DUTY';
    if (!rec.checkInTime) {
      rec.checkInTime = time;
      rec.checkInLat = latitude;
      rec.checkInLng = longitude;
      rec.checkInAccuracy = accuracy;
    }
    rec.source = 'MANUAL';
    rec.verificationStatus = 'VERIFIED';
    if (!rec.workingMinutes) rec.workingMinutes = 480;
    const summary = {
      visitId: visit.id,
      clientName,
      clientLocation,
      contactPerson,
      contactPhone,
      purpose,
      timestamp: time,
      latitude,
      longitude,
      accuracy,
    };
    rec.clientVisit = summary;
    rec.clientVisits.push(summary);
    rec.events.push({
      id: `ev_${Date.now()}`,
      timestamp: time,
      eventType: 'CLIENT_CHECKIN',
      latitude,
      longitude,
      accuracy,
      note: `Client Site Checked In: ${clientName}`,
    });
    await rec.save();

    const meta = visit.toObject();
    delete meta.selfieData;
    delete meta.siteData;
    broadcastAdmin('attendance', { record: rec.toObject(), reason: 'CLIENT_VISIT' });
    broadcastAdmin('client-visit', meta);
    res.status(201).json({ record: rec.toObject(), visit: meta });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/me/salary-slips -> sirf meri (admin ki upload ki hui) salary slips
router.get('/salary-slips', async (req, res) => {
  try {
    const list = await SalarySlip.find({ employeeId: req.auth.employeeId }, '-data').sort({ month: -1 }).lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/salary-slips/:slipId/file', async (req, res) => {
  try {
    const s = await SalarySlip.findOne({ id: req.params.slipId, employeeId: req.auth.employeeId });
    if (!s) return res.status(404).json({ error: 'Salary slip nahi mili' });
    res.set({ 'Content-Type': s.mimeType, 'Content-Length': s.data.length, 'X-Content-Type-Options': 'nosniff' });
    res.send(s.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/me/leave-balance -> meri bachi hui leave
router.get('/leave-balance', async (req, res) => {
  try {
    const emp = await Employee.findOne({ id: req.auth.employeeId }).lean();
    if (!emp) return res.status(401).json({ error: 'Aapka account ab maujood nahi hai' });
    res.json(await getBalance(emp, todayIST().slice(0, 4)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/me/messages -> mere liye aaye admin ke messages
router.get('/messages', async (req, res) => {
  try {
    const id = req.auth.employeeId;
    const list = await Message.find({ $or: [{ toAll: true }, { recipientIds: id }] })
      .sort({ sentAt: -1 }).limit(50).lean();
    res.json(list.map((m) => forEmployee(m, id)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/me/messages/read -> mere saare messages "padh liye" mark karo
router.post('/messages/read', async (req, res) => {
  try {
    const id = req.auth.employeeId;
    await Message.updateMany(
      { $or: [{ toAll: true }, { recipientIds: id }], readBy: { $ne: id } },
      { $addToSet: { readBy: id } }
    );
    broadcastAdmin('message-read', { employeeId: id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
