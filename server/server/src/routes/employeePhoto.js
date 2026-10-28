// /api/employees/:id/photo (sirf admin): employee ki profile photo lagao / hatao.
// Photo employee ke mobile app me bhi wahi dikhti hai (employee.avatar = /api/photos/<token>)
const express = require('express');
const crypto = require('crypto');
const router = express.Router({ mergeParams: true });
const Employee = require('../models/Employee');
const EmployeePhoto = require('../models/EmployeePhoto');
const { sendToEmployee } = require('../utils/realtime');

const MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 1024 * 1024; // 1 MB

// PUT { photoBase64, photoMime }
router.put('/', async (req, res) => {
  try {
    const emp = await Employee.findOne({ id: req.params.id });
    if (!emp) return res.status(404).json({ error: 'Employee nahi mila' });

    const { photoBase64, photoMime } = req.body || {};
    if (!MIME.includes(photoMime)) return res.status(400).json({ error: 'Photo JPG, PNG ya WEBP honi chahiye' });
    const buf = Buffer.from(String(photoBase64 || '').replace(/^data:[^;]+;base64,/, ''), 'base64');
    if (buf.length === 0) return res.status(400).json({ error: 'Photo khali hai' });
    if (buf.length > MAX_BYTES) return res.status(400).json({ error: 'Photo 1 MB se chhoti honi chahiye' });

    const token = crypto.randomBytes(16).toString('hex');
    await EmployeePhoto.deleteMany({ employeeId: emp.id });
    await EmployeePhoto.create({ token, employeeId: emp.id, mimeType: photoMime, data: buf, uploadedAt: new Date().toISOString() });
    emp.avatar = `/api/photos/${token}`;
    await emp.save();

    sendToEmployee(emp.id, 'profile-updated', {}); // employee ka app naya photo turant le le
    res.json(emp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/', async (req, res) => {
  try {
    const emp = await Employee.findOne({ id: req.params.id });
    if (!emp) return res.status(404).json({ error: 'Employee nahi mila' });
    await EmployeePhoto.deleteMany({ employeeId: emp.id });
    emp.avatar = '';
    await emp.save();
    sendToEmployee(emp.id, 'profile-updated', {});
    res.json(emp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
