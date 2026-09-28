const mongoose = require('mongoose');

const ExpenseClaimSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true, index: true },
  employeeName: String,
  category: String,
  amount: Number,
  date: String,
  description: String,
  receiptName: String,
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('ExpenseClaim', ExpenseClaimSchema);
