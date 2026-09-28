const mongoose = require('mongoose');

const AuditLogEntrySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  timestamp: String,
  actor: String,
  role: String,
  action: String,
  entity: String,
  entityId: String,
  details: String,
  ipAddress: String,
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('AuditLogEntry', AuditLogEntrySchema);
