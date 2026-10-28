const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  empId: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  email: String,
  phone: String,
  avatar: String,
  department: String,
  designation: String,
  branch: String,
  officeId: String,
  shiftId: String,
  reportingManager: String,
  joiningDate: String,
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  employmentType: String,
  workType: { type: String, enum: ['IN_OFFICE', 'FIELD_WORK'], default: 'IN_OFFICE' },
  loginId: { type: String, unique: true, sparse: true },
  password: String,
  ctcAnnual: Number,
  basicMonthly: Number,
  hraMonthly: Number,
  specialAllowanceMonthly: Number,
  bankAccount: String,
  bankName: String,
  ifsc: String,
  pan: String,
  aadhaar: String,
  uan: String,
  // Padhai ki details (certificate file EmployeeDocument me alag se save hoti hai)
  education: [{
    _id: false,
    degree: String,
    institute: String,
    year: String,
  }],
  // Joining ka tareeka: TRAINING (training period) ya DIRECT (seedha working)
  workMode: { type: String, enum: ['TRAINING', 'DIRECT'], default: 'DIRECT' },
  trainingMonths: Number,
  trainingStipendMonthly: Number,
  trainingEndDate: String,
  // Saal bhar ki fix leave (khali ho to default: CASUAL 12, SICK 10, EARNED 15)
  leaveQuota: {
    CASUAL: Number,
    SICK: Number,
    EARNED: Number,
  },
  // Ek branch se doosre me transfer ka record
  transferHistory: [{
    _id: false,
    date: String,
    fromOfficeId: String,
    fromOfficeName: String,
    toOfficeId: String,
    toOfficeName: String,
    reason: String,
  }],
  deactivationReason: String,
  currentLat: Number,
  currentLng: Number,
  accuracyMeters: Number,
}, { timestamps: true, versionKey: false });

EmployeeSchema.plugin(require('../utils/tenant').tenantPlugin);

module.exports = mongoose.model('Employee', EmployeeSchema);
