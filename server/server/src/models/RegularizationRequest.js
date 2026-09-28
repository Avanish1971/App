const mongoose = require('mongoose');

const RegularizationRequestSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true, index: true },
  employeeName: String,
  date: String,
  requestedCheckIn: String,
  requestedCheckOut: String,
  reason: String,
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  appliedAt: String,
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('RegularizationRequest', RegularizationRequestSchema);
