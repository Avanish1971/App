const mongoose = require('mongoose');

// Field work wale employee ka ek client visit: kaha gaya, kyu gaya, client ki info, live location + 2 photos (DB me)
const ClientVisitSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true, index: true },
  employeeName: String,
  date: { type: String, required: true, index: true }, // YYYY-MM-DD (IST)
  time: String, // "09:48 AM"
  clientName: { type: String, required: true },
  clientLocation: String,
  contactPerson: String,
  contactPhone: String,
  purpose: String, // kyu gaya tha
  latitude: Number,
  longitude: Number,
  accuracy: Number,
  selfieData: Buffer, // employee ki khud ki selfie
  selfieMime: String,
  siteData: Buffer, // jis jagah gaya uski photo
  siteMime: String,
  visitedAt: String, // ISO
}, { timestamps: true, versionKey: false });

ClientVisitSchema.plugin(require('../utils/tenant').tenantPlugin);

module.exports = mongoose.model('ClientVisit', ClientVisitSchema);
