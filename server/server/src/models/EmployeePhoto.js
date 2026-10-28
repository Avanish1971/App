const mongoose = require('mongoose');

// Employee ki profile photo. Link me ek anjaan (random) token hota hai, taaki photo <img> me dikh sake.
const EmployeePhotoSchema = new mongoose.Schema({
  token: { type: String, required: true, index: true },
  employeeId: { type: String, required: true, index: true },
  mimeType: String,
  data: { type: Buffer, required: true },
  uploadedAt: String,
}, { timestamps: true, versionKey: false });

EmployeePhotoSchema.plugin(require('../utils/tenant').tenantPlugin);

module.exports = mongoose.model('EmployeePhoto', EmployeePhotoSchema);
