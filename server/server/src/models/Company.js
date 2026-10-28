const mongoose = require('mongoose');

// Ek customer company. Isi ka admin login hota hai; baaki saara data (employee, office...) companyId se jura rehta hai.
// (Ye model tenant-scoped nahi hai, kyunki login se pehle company dhundhni padti hai.)
const CompanySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true }, // employees login ke time ye code dalte hain
  name: { type: String, default: '' },
  empPrefix: { type: String, default: 'EMP' }, // employee ID ka shuruaat (jaise SHAR-1001)
  adminEmail: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  logoData: Buffer,
  logoMime: String,
  createdAt: String,
  updatedAt: String,
}, { versionKey: false });

module.exports = mongoose.model('Company', CompanySchema);
