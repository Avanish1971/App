const mongoose = require('mongoose');

// Employee ke scan/photo/PDF documents — file MongoDB me hi save hoti hai (data = binary)
const EmployeeDocumentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: ['AADHAAR', 'PAN', 'BANK_PROOF', 'EDUCATION', 'PHOTO', 'RESUME', 'OFFER_LETTER', 'OTHER'],
    required: true,
  },
  label: String, // jaise "B.Com 2019" ya "Experience Letter"
  fileName: String,
  mimeType: String,
  size: Number,
  data: { type: Buffer, required: true },
  uploadedAt: String,
}, { timestamps: true, versionKey: false });

EmployeeDocumentSchema.plugin(require('../utils/tenant').tenantPlugin);

module.exports = mongoose.model('EmployeeDocument', EmployeeDocumentSchema);
