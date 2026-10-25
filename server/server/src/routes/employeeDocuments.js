// /api/employees/:id/documents  (sirf admin) — employee ke document upload / dekhna / delete
// File JSON me base64 aati hai (extra package nahi chahiye) aur MongoDB me binary save hoti hai.
const express = require('express');
const router = express.Router({ mergeParams: true });
const Employee = require('../models/Employee');
const EmployeeDocument = require('../models/EmployeeDocument');

const MAX_BYTES = 3 * 1024 * 1024; // ek file max 3 MB
const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const TYPES = ['AADHAAR', 'PAN', 'BANK_PROOF', 'EDUCATION', 'PHOTO', 'RESUME', 'OFFER_LETTER', 'OTHER'];

// GET -> documents ki list (file ka data nahi, sirf details)
router.get('/', async (req, res) => {
  try {
    const docs = await EmployeeDocument.find({ employeeId: req.params.id }, '-data').sort({ createdAt: 1 }).lean();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST { type, label, fileName, mimeType, dataBase64 }
router.post('/', async (req, res) => {
  try {
    const emp = await Employee.findOne({ id: req.params.id }, 'id');
    if (!emp) return res.status(404).json({ error: 'Employee nahi mila' });

    const { type, label, fileName, mimeType, dataBase64 } = req.body || {};
    if (!TYPES.includes(type)) return res.status(400).json({ error: 'Document type galat hai' });
    if (!ALLOWED_MIME.includes(mimeType)) {
      return res.status(400).json({ error: 'Sirf PDF, JPG, PNG ya WEBP file allowed hai' });
    }
    const b64 = String(dataBase64 || '').replace(/^data:[^;]+;base64,/, '');
    const buf = Buffer.from(b64, 'base64');
    if (buf.length === 0) return res.status(400).json({ error: 'File khali hai' });
    if (buf.length > MAX_BYTES) return res.status(400).json({ error: 'File 3 MB se badi hai' });

    const doc = await EmployeeDocument.create({
      id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      employeeId: emp.id,
      type,
      label: String(label || '').slice(0, 120),
      fileName: String(fileName || 'file').slice(0, 200),
      mimeType,
      size: buf.length,
      data: buf,
      uploadedAt: new Date().toISOString(),
    });
    const { data, ...meta } = doc.toObject();
    res.status(201).json(meta);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:docId/file -> asli file (download / dekhne ke liye)
router.get('/:docId/file', async (req, res) => {
  try {
    const doc = await EmployeeDocument.findOne({ id: req.params.docId, employeeId: req.params.id });
    if (!doc) return res.status(404).json({ error: 'Document nahi mila' });
    res.set({
      'Content-Type': doc.mimeType,
      'Content-Length': doc.data.length,
      'Content-Disposition': `inline; filename="${encodeURIComponent(doc.fileName || 'file')}"`,
      'X-Content-Type-Options': 'nosniff',
    });
    res.send(doc.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:docId', async (req, res) => {
  try {
    const r = await EmployeeDocument.deleteOne({ id: req.params.docId, employeeId: req.params.id });
    if (!r.deletedCount) return res.status(404).json({ error: 'Document nahi mila' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
