// Server start hote hi (har baar, safe): purana single-company data ko "default company" me daalta hai
// aur database ke indexes ko multi-company ke hisaab se theek karta hai. Naya/khali database ho to kuch nahi karta.
const Company = require('../models/Company');
const { runUnscoped } = require('./tenant');
const { hashPassword, verifyPassword } = require('./password');

const TENANT_MODELS = [
  require('../models/Employee'),
  require('../models/Office'),
  require('../models/Shift'),
  require('../models/AttendanceRecord'),
  require('../models/LeaveRequest'),
  require('../models/RegularizationRequest'),
  require('../models/ExpenseClaim'),
  require('../models/AuditLogEntry'),
  require('../models/AttendancePolicy'),
  require('../models/Message'),
  require('../models/ClientVisit'),
  require('../models/EmployeeDocument'),
  require('../models/SalarySlip'),
  require('../models/EmployeePhoto'),
];

const DEFAULT_ID = 'cmp_default';
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const randomCode = () => Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');

async function migrate() {
  await runUnscoped(async () => {
    // 1) Purani (single company) Company entry: id nahi hoti. Use hata ke default company me badlenge.
    const legacy = await Company.collection.findOne({ id: { $exists: false } });
    if (legacy) await Company.collection.deleteMany({ id: { $exists: false } });
    await Company.syncIndexes();

    // 2) Kya purana data hai jo kisi company se juda nahi?
    let untagged = 0;
    for (const M of TENANT_MODELS) untagged += await M.countDocuments({ companyId: { $exists: false } });

    const email = (process.env.ADMIN_EMAIL || 'admin@geoattend.com').trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'Admin@2026';

    let def = await Company.findOne({ id: DEFAULT_ID });
    if (!def && (untagged > 0 || legacy)) {
      let code = randomCode();
      while (await Company.findOne({ code }, 'id')) code = randomCode();
      const now = new Date().toISOString();
      def = await Company.create({
        id: DEFAULT_ID,
        code,
        name: (legacy && legacy.name) || process.env.COMPANY_NAME || 'My Company',
        empPrefix: 'ACME', // purane employees ke ID ACME-xxxx the
        adminEmail: email,
        passwordHash: await hashPassword(password),
        logoData: legacy && legacy.logoData ? legacy.logoData.buffer ? Buffer.from(legacy.logoData.buffer) : legacy.logoData : undefined,
        logoMime: legacy && legacy.logoMime,
        createdAt: now,
        updatedAt: now,
      });
      console.log(`🏢 Purana data "${def.name}" company me daal diya. Company Code: ${def.code}  Admin: ${email}`);
    }

    // Purane admin ka login .env se hi chalta rahe (ADMIN_EMAIL / ADMIN_PASSWORD badlo to yahan bhi badal jaye)
    if (def) {
      const stale = def.adminEmail !== email || !(await verifyPassword(password, def.passwordHash));
      if (stale) {
        def.adminEmail = email;
        def.passwordHash = await hashPassword(password);
        await def.save();
      }
    }

    // 3) Purana data default company ke naam
    if (untagged > 0 && def) {
      for (const M of TENANT_MODELS) {
        await M.updateMany({ companyId: { $exists: false } }, { $set: { companyId: DEFAULT_ID } });
      }
    }
  });

  // 4) Indexes: "id unique" ki jagah "company ke andar unique"
  for (const M of TENANT_MODELS) {
    try {
      await M.syncIndexes();
    } catch (err) {
      console.error(`Index sync fail (${M.modelName}):`, err.message);
    }
  }
}

module.exports = { migrate };
