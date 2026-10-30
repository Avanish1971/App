const mongoose = require('mongoose');

const AttendanceEventSchema = new mongoose.Schema({
  id: String,
  timestamp: String,
  eventType: String,
  latitude: Number,
  longitude: Number,
  accuracy: Number,
  note: String,
}, { _id: false });

const ClientVisitSchema = new mongoose.Schema({
  visitId: String,
  contactPerson: String,
  contactPhone: String,
  accuracy: Number,
  clientName: String,
  clientLocation: String,
  purpose: String,
  timestamp: String,
  latitude: Number,
  longitude: Number,
}, { _id: false });

const AttendanceRecordSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true, index: true },
  date: { type: String, required: true, index: true },
  officeId: String,
  shiftId: String,
  status: {
    type: String,
    enum: ['SCHEDULED', 'PRESENT', 'ON_BREAK', 'ON_DUTY', 'WFH', 'ON_LEAVE', 'ABSENT', 'OUTSIDE_GEOFENCE', 'HALF_DAY', 'CHECKED_OUT'],
    default: 'SCHEDULED',
  },
  checkInTime: String,
  checkInLat: Number,
  checkInLng: Number,
  checkInAccuracy: Number,
  checkOutTime: String,
  checkOutLat: Number,
  checkOutLng: Number,
  workingMinutes: { type: Number, default: 0 },
  breakMinutes: { type: Number, default: 0 },
  overtimeMinutes: { type: Number, default: 0 },
  isLate: { type: Boolean, default: false },
  isEarlyExit: { type: Boolean, default: false },
  source: { type: String, enum: ['AUTO_GEOFENCE', 'MANUAL', 'ADMIN'], default: 'MANUAL' },
  verificationStatus: { type: String, enum: ['VERIFIED', 'PENDING'], default: 'PENDING' },
  // Geofence tracking (server khud bharta hai)
  outsideSince: Date,
  lastPingAt: Date,
  // Office se bahar jaana-aana: kab gaya, kab wapas aaya, kitne minute bahar raha
  outings: [{
    _id: false,
    leftAt: String, // ISO
    leftTime: String, // "11:20 AM"
    returnedAt: String,
    returnedTime: String,
    minutes: Number,
  }],
  totalOutMinutes: { type: Number, default: 0 },
  locationType: String, // field staff: 'OFFICE' (office me) / 'FIELD' (bahar)
  signalLost: Boolean, // true = kuch minute se location nahi aa rahi (app band / location band)
  lastLat: Number,
  lastLng: Number,
  lastDistanceMeters: Number,
  insideGeofence: Boolean,
  clientVisit: ClientVisitSchema, // sabse latest visit
  clientVisits: [ClientVisitSchema], // aaj ke saare visits
  events: [AttendanceEventSchema],
}, { timestamps: true, versionKey: false });

// One attendance record per employee per day
AttendanceRecordSchema.index({ employeeId: 1, date: 1 }, { unique: true });

AttendanceRecordSchema.plugin(require('../utils/tenant').tenantPlugin);

module.exports = mongoose.model('AttendanceRecord', AttendanceRecordSchema);