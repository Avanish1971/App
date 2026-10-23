const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const { sign, safeEqual } = require('../utils/token');

// Admin ka email/password server ki .env se aata hai (ADMIN_EMAIL, ADMIN_PASSWORD)
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@geoattend.com').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@2026';
if (!process.env.ADMIN_PASSWORD) {
  console.warn('⚠️  ADMIN_PASSWORD .env me set nahi hai. Purana default password chal raha hai, jaldi badlo.');
}

const ADMIN_TTL = 12 * 60 * 60; // 12 ghante
const EMPLOYEE_TTL = 30 * 24 * 60 * 60; // 30 din (phone me baar-baar login na karna pade)

// Galat password ki koshish rokne ke liye: 10 minute me 5 galat = rok
const attempts = new Map();
const MAX_FAILS = 5;
const WINDOW_MS = 10 * 60 * 1000;
function isBlocked(key) {
  const a = attempts.get(key);
  if (!a) return false;
  if (Date.now() - a.first > WINDOW_MS) { attempts.delete(key); return false; }
  return a.count >= MAX_FAILS;
}
function recordFail(key) {
  const a = attempts.get(key);
  if (!a || Date.now() - a.first > WINDOW_MS) attempts.set(key, { count: 1, first: Date.now() });
  else a.count += 1;
}
const TOO_MANY = { error: 'Bahut zyada galat koshish. 10 minute baad phir try karo.' };

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// POST /api/auth/admin-login  { email, password }
router.post('/admin-login', (req, res) => {
  const email = String((req.body && req.body.email) || '').trim().toLowerCase();
  const password = String((req.body && req.body.password) || '');
  const key = `admin|${req.ip}`;
  if (isBlocked(key)) return res.status(429).json(TOO_MANY);

  const emailOk = safeEqual(email, ADMIN_EMAIL);
  const passOk = safeEqual(password, ADMIN_PASSWORD);
  if (!(emailOk && passOk)) {
    recordFail(key);
    return res.status(401).json({ error: 'Email ya password galat hai' });
  }
  attempts.delete(key);
  res.json({ token: sign({ role: 'admin', sub: ADMIN_EMAIL }, ADMIN_TTL) });
});

// POST /api/auth/employee-login  { loginId, password }   (loginId = login ID / Employee ID / email)
router.post('/employee-login', async (req, res) => {
  try {
    const loginId = String((req.body && req.body.loginId) || '').trim();
    const password = String((req.body && req.body.password) || '');
    if (!loginId || !password) return res.status(400).json({ error: 'Login ID aur password dono daalo' });

    const key = `emp|${req.ip}|${loginId.toLowerCase()}`;
    if (isBlocked(key)) return res.status(429).json(TOO_MANY);

    const rx = new RegExp(`^${escapeRegex(loginId)}$`, 'i');
    const emp = await Employee.findOne({ $or: [{ loginId: rx }, { empId: rx }, { email: rx }] });
    const valid = !!emp && !!emp.password && safeEqual(password, emp.password);
    if (!valid) {
      recordFail(key);
      return res.status(401).json({ error: 'Login ID ya password galat hai' });
    }
    if (emp.status === 'INACTIVE') {
      return res.status(403).json({ error: 'Aapki ID band (deactivate) hai. HR se baat karo.' });
    }
    attempts.delete(key);
    res.json({
      token: sign({ role: 'employee', employeeId: emp.id, sub: emp.empId }, EMPLOYEE_TTL),
      employee: { id: emp.id, empId: emp.empId, fullName: emp.fullName },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
