const mongoose = require('mongoose');

const LeaveRequestSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true, index: true },
  employeeName: String,
  leaveType: { type: String, enum: ['CASUAL', 'SICK', 'EARNED'], required: true },
  startDate: String,
  endDate: String,
  daysCount: Number,
  isHalfDay: Boolean,
  reason: String,
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  appliedAt: String,
  approvedBy: String,
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('LeaveRequest', LeaveRequestSchema);
