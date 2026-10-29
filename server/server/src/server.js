require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');

const employeesRouter = require('./routes/employees');
const officesRouter = require('./routes/offices');
const shiftsRouter = require('./routes/shifts');
const attendanceRouter = require('./routes/attendance');
const leavesRouter = require('./routes/leaves');
const regularizationsRouter = require('./routes/regularizations');
const expensesRouter = require('./routes/expenses');
const auditLogsRouter = require('./routes/auditLogs');
const policyRouter = require('./routes/policy');
const { startSweeper } = require('./utils/geofence');
const authRouter = require('./routes/auth');
const meRouter = require('./routes/me');
const messagesRouter = require('./routes/messages');
const employeeDocumentsRouter = require('./routes/employeeDocuments');
const clientVisitsRouter = require('./routes/clientVisits');
const salarySlipsRouter = require('./routes/salarySlips');
const companyRouter = require('./routes/company');
const employeePhotoRouter = require('./routes/employeePhoto');
const photosRouter = require('./routes/photos');
const eventsRouter = require('./routes/events');
const { requireRole, attendanceGuard, requestsGuard, tenantScope } = require('./middleware/auth');
const { migrate } = require('./utils/migrate');

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000' }));
// Document upload ke liye bada body chahiye (sirf us route par); baaki sab jagah chhota limit
const DOC_ROUTE = /^\/api\/(employees\/[^/]+\/(documents|salary-slips|photo)|me\/client-visits|company|auth\/register)/;
const smallJson = express.json();
app.use((req, res, next) => (DOC_ROUTE.test(req.path) ? next() : smallJson(req, res, next)));

app.get('/', (req, res) => res.json({ status: 'ok', message: 'location_app API running' }));

// Login ke bina kuch nahi: admin ke kaam sirf admin token se, employee sirf apna data.
// Har route me `tenantScope` ke baad ka kaam sirf usi company ke data par chalta hai.
const admin = requireRole('admin');
app.use('/api/auth', authRouter);
app.use('/api/photos', photosRouter); // profile photo (random token wala link)
app.use('/api/company', companyRouter); // public/logo bina login, baaki route khud guard karte hain
app.use('/api/events', eventsRouter); // live stream (token URL me, route khud verify karta hai)
app.use('/api/me/client-visits', requireRole('employee'), express.json({ limit: '6mb' })); // photos wala bada body
app.use('/api/me', requireRole('employee'), tenantScope, meRouter);
app.use('/api/messages', admin, tenantScope, messagesRouter);
app.use('/api/client-visits', admin, tenantScope, clientVisitsRouter);
app.use('/api/employees/:id/documents', admin, express.json({ limit: '6mb' }), tenantScope, employeeDocumentsRouter);
app.use('/api/employees/:id/photo', admin, express.json({ limit: '3mb' }), tenantScope, employeePhotoRouter);
app.use('/api/employees/:id/salary-slips', admin, express.json({ limit: '6mb' }), tenantScope, salarySlipsRouter);
app.use('/api/employees', admin, tenantScope, employeesRouter);
app.use('/api/offices', admin, tenantScope, officesRouter);
app.use('/api/shifts', admin, tenantScope, shiftsRouter);
app.use('/api/attendance', attendanceGuard, tenantScope, attendanceRouter);
app.use('/api/leaves', requestsGuard, tenantScope, leavesRouter);
app.use('/api/regularizations', requestsGuard, tenantScope, regularizationsRouter);
app.use('/api/expenses', admin, tenantScope, expensesRouter);
app.use('/api/audit-logs', admin, tenantScope, auditLogsRouter);
app.use('/api/policy', admin, tenantScope, policyRouter);

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  await migrate().catch((err) => console.error('Migration error:', err.message));
  startSweeper();
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
});