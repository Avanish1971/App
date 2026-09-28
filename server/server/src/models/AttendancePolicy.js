const mongoose = require('mongoose');

// Singleton document — only ONE policy record ever exists (id: 'policy_global')
const AttendancePolicySchema = new mongoose.Schema({
  id: { type: String, default: 'policy_global', unique: true },
  geofenceRadiusMeters: Number,
  gpsAccuracyMaxMeters: Number,
  exitGracePeriodMinutes: Number,
  gracePeriodForLateMinutes: Number,
  lateMarkThresholdMinutes: Number,
  halfDayThresholdHours: Number,
  autoCheckoutTime: String,
  requireMockLocationCheck: Boolean,
  allowOfflineAttendance: Boolean,
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('AttendancePolicy', AttendancePolicySchema);
