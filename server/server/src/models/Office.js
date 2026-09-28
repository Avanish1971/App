const mongoose = require('mongoose');

const OfficeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  city: String,
  address: String,
  latitude: Number,
  longitude: Number,
  radiusMeters: Number,
  workingHours: String,
  allowedDepartments: [String],
  activeEmployeeCount: Number,
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('Office', OfficeSchema);
