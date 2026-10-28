const mongoose = require('mongoose');

// Admin ka message: toAll = true  -> sabhi employees ko
//                   toAll = false -> sirf recipientIds wale employees ko
const MessageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  text: { type: String, required: true },
  fromName: { type: String, default: 'Admin' },
  toAll: { type: Boolean, default: false },
  recipientIds: [String],
  recipientNames: [String],
  readBy: [String],
  sentAt: { type: String, required: true }, // ISO
}, { timestamps: true, versionKey: false });

MessageSchema.index({ sentAt: -1 });

MessageSchema.plugin(require('../utils/tenant').tenantPlugin);

module.exports = mongoose.model('Message', MessageSchema);
