const mongoose = require('mongoose');

const ShiftSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  startTime: String,
  endTime: String,
  breakDurationMinutes: Number,
  gracePeriodMinutes: Number,
  lateThresholdMinutes: Number,
  earlyCheckoutMinutes: Number,
  isOvernight: Boolean,
}, { timestamps: true, versionKey: false });

ShiftSchema.plugin(require('../utils/tenant').tenantPlugin);

module.exports = mongoose.model('Shift', ShiftSchema);
