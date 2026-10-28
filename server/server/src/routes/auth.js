const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const Company = require('../models/Company');
const Shift = require('../models/Shift');
const { sign, safeEqual } = require('../utils/token');
const { hashPassword, verifyPassword } = require('../utils/password');
const { runWithTenant, runUnscoped } = require('../utils/tenant');

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

// Naye account (signup) ki bhi had: ek IP se ghante me 5
const signups = new Map();
function signupLimited(ip) {
  const now = Date.now();
  const list = (signups.get(ip) || []).filter((t) => now - t < 60 * 60 * 1000);
  signups.set(ip, list);
  return list.length >= 5;
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 0/O, 1/I jaise confusing akshar nahi
function randomCode(len = 6) {
  let s = '';
  for (let i = 0; i < len; i += 1) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return s;
}
const prefixFrom = (name) => (String(name).replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase() || 'EMP');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOGO_MIME = ['image/png', 'image/jpeg', 'image/webp'];

// POST /api/auth/register  { companyName, email, password, logoBase64?, logoMime? }
// Naya customer apni company ka account khud banata hai aur wahi uska admin ban jata hai.
router.post('/register', express.json({ limit: '3mb' }), async (req, res) => {
  try {
    if (String(process.env.ALLOW_SIGNUP).toLowerCase() === 'false') {
      return res.status(403).json({ error: 'Naya account banana abhi band hai. Apne software provider se sampark karo.' });
    }
    if (signupLimited(req.ip)) return res.status(429).json({ error: 'Bahut zyada account banaye gaye. Thodi der baad try karo.' });

    const b = req.body || {};
    const name = String(b.companyName || '').trim().slice(0, 120);
    const email = String(b.email || '').trim().toLowerCase();
    const password = String(b.password || '');
    if (!name) return res.status(400).json({ error: 'Company ka naam likho' });
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Sahi email likho' });
    if (password.length < 8) return res.status(400).json({ error: 'Password kam se kam 8 akshar ka rakho' });

    let logoData;
    let logoMime;
    if (b.logoBase64) {
      if (!LOGO_MIME.includes(b.logoMime)) return res.status(400).json({ error: 'Logo PNG, JPG ya WEBP hona chahiye' });
      logoData = Buffer.from(String(b.logoBase64).replace(/^data:[^;]+;base64,/, ''), 'base64');
      if (logoData.length === 0 || logoData.length > 1024 * 1024) return res.status(400).json({ error: 'Logo 1 MB se chhota hona chahiye' });
      logoMime = b.logoMime;
    }

    if (await Company.findOne({ adminEmail: email }, 'id')) {
      return res.status(409).json({ error: 'Is email se account pehle se bana hua hai. Login karo.' });
    }

    let code = randomCode();
    while (await Company.findOne({ code }, 'id')) code = randomCode();

    const now = new Date().toISOString();
    const company = await Company.create({
      id: `cmp_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      code,
      name,
      empPrefix: prefixFrom(name),
      adminEmail: email,
      passwordHash: await hashPassword(password),
      logoData,
      logoMime,
      createdAt: now,
      updatedAt: now,
    });

    // Nayi company ko ek default shift do (office aur employees admin khud jodega)
    await runWithTenant(company.id, async () =>
      await Shift.create({
        id: 'shift_general',
        name: 'General Shift',
        startTime: '10:00 AM',
        endTime: '06:00 PM',
        breakDurationMinutes: 60,
        gracePeriodMinutes: 15,
        lateThresholdMinutes: 30,
        earlyCheckoutMinutes: 30,
        isOvernight: false,
      })
    );

    signups.get(req.ip).push(Date.now());
    res.status(201).json({
      token: sign({ role: 'admin', companyId: company.id, sub: email }, ADMIN_TTL),
      company: { name: company.name, code: company.code },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/admin-login  { email, password }
router.post('/admin-login', async (req, res) => {
  try {
    const email = String((req.body && req.body.email) || '').trim().toLowerCase();
    const password = String((req.body && req.body.password) || '');
    const key = `admin|${req.ip}`;
    if (isBlocked(key)) return res.status(429).json(TOO_MANY);

    const company = await Company.findOne({ adminEmail: email });
    const ok = company ? await verifyPassword(password, company.passwordHash) : (await verifyPassword(password, 'x'), false);
    if (!ok) {
      recordFail(key);
      return res.status(401).json({ error: 'Email ya password galat hai' });
    }
    attempts.delete(key);
    res.json({
      token: sign({ role: 'admin', companyId: company.id, sub: email }, ADMIN_TTL),
      company: { name: company.name, code: company.code },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/employee-login  { loginId, password, companyCode? }  (loginId = login ID / Employee ID / email)
router.post('/employee-login', async (req, res) => {
  try {
    const loginId = String((req.body && req.body.loginId) || '').trim();
    const password = String((req.body && req.body.password) || '');
    const companyCode = String((req.body && req.body.companyCode) || '').trim().toUpperCase();
    if (!loginId || !password) return res.status(400).json({ error: 'Login ID aur password dono daalo' });

    const key = `emp|${req.ip}|${companyCode}|${loginId.toLowerCase()}`;
    if (isBlocked(key)) return res.status(429).json(TOO_MANY);

    const rx = new RegExp(`^${escapeRegex(loginId)}$`, 'i');
    const filter = { $or: [{ loginId: rx }, { empId: rx }, { email: rx }] };

    let candidates;
    if (companyCode) {
      const company = await Company.findOne({ code: companyCode }, 'id');
      if (!company) {
        recordFail(key);
        return res.status(401).json({ error: 'Company Code galat hai' });
      }
      candidates = await runWithTenant(company.id, async () => await Employee.find(filter).limit(2));
    } else {
      // Code nahi diya: agar ye ID poore system me sirf ek jagah mili to chalega (purane employees ke liye)
      candidates = await runUnscoped(async () => await Employee.find(filter).limit(3));
      if (candidates.length > 1) {
        return res.status(400).json({ error: 'Company Code bhi daalo (HR se pucho)' });
      }
    }

    const emp = candidates[0];
    const valid = !!emp && !!emp.password && safeEqual(password, emp.password);
    if (!valid) {
      recordFail(key);
      return res.status(401).json({ error: 'Login ID ya password galat hai' });
    }
    if (emp.status === 'INACTIVE') {
      return res.status(403).json({ error: 'Aapki ID band (deactivate) hai. HR se baat karo.' });
    }
    attempts.delete(key);
    const company = await Company.findOne({ id: emp.companyId }, 'code name');
    res.json({
      token: sign({ role: 'employee', companyId: emp.companyId, employeeId: emp.id, sub: emp.empId }, EMPLOYEE_TTL),
      employee: { id: emp.id, empId: emp.empId, fullName: emp.fullName },
      company: company ? { code: company.code, name: company.name } : undefined,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
