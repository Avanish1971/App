const mongoose = require('mongoose');

// Admin ki upload ki hui salary slip (PDF / photo). Employee sirf apni slip dekh sakta hai.
const SalarySlipSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true, index: true },
  month: { type: String, required: true }, // YYYY-MM
  fileName: String,
  mimeType: String,
  size: Number,
  data: { type: Buffer, required: true },
  uploadedAt: String,
}, { timestamps: true, versionKey: false });

// Ek employee ki ek mahine ki ek hi slip (dobara upload = replace)
SalarySlipSchema.index({ employeeId: 1, month: 1 }, { unique: true });

SalarySlipSchema.plugin(require('../utils/tenant').tenantPlugin);

module.exports = mongoose.model('SalarySlip', SalarySlipSchema);
