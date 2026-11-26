require('dotenv').config();
const path = require('path');
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
const salarySlipsAllRouter = require('./routes/salarySlipsAll');
const companyRouter = require('./routes/company');
const employeePhotoRouter = require('./routes/employeePhoto');
const photosRouter = require('./routes/photos');
const slipDownloadRouter = require('./routes/slipDownload');
const eventsRouter = require('./routes/events');
const { requireRole, attendanceGuard, requestsGuard, tenantScope } = require('./middleware/auth');
const { migrate } = require('./utils/migrate');

const app = express();

app.use(cors({ origin: true, credentials: true }));
const DOC_ROUTE = /^\/api\/(employees\/[^/]+\/(documents|salary-slips|photo)|me\/client-visits|company|auth\/register)/;
const smallJson = express.json();
app.use((req, res, next) => (DOC_ROUTE.test(req.path) ? next() : smallJson(req, res, next)));

app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'location_app API running' }));

const admin = requireRole('admin');
app.use('/api/auth', authRouter);
app.use('/api/slip-download', slipDownloadRouter);
app.use('/api/photos', photosRouter);
app.use('/api/company', companyRouter);
app.use('/api/events', eventsRouter);
app.use('/api/me/client-visits', requireRole('employee'), express.json({ limit: '6mb' }));
app.use('/api/me', requireRole('employee'), tenantScope, meRouter);
app.use('/api/messages', admin, tenantScope, messagesRouter);
app.use('/api/client-visits', admin, tenantScope, clientVisitsRouter);
app.use('/api/employees/:id/documents', admin, express.json({ limit: '6mb' }), tenantScope, employeeDocumentsRouter);
app.use('/api/employees/:id/photo', admin, express.json({ limit: '3mb' }), tenantScope, employeePhotoRouter);
app.use('/api/employees/:id/salary-slips', admin, express.json({ limit: '6mb' }), tenantScope, salarySlipsRouter);
app.use('/api/salary-slips', admin, tenantScope, salarySlipsAllRouter);
app.use('/api/employees', admin, tenantScope, employeesRouter);
app.use('/api/offices', admin, tenantScope, officesRouter);
app.use('/api/shifts', admin, tenantScope, shiftsRouter);
app.use('/api/attendance', attendanceGuard, tenantScope, attendanceRouter);
app.use('/api/leaves', requestsGuard, tenantScope, leavesRouter);
app.use('/api/regularizations', requestsGuard, tenantScope, regularizationsRouter);
app.use('/api/expenses', admin, tenantScope, expensesRouter);
app.use('/api/audit-logs', admin, tenantScope, auditLogsRouter);
app.use('/api/policy', admin, tenantScope, policyRouter);

app.get('/', (req, res) => res.json({ status: 'GeoAttend API Server Online' }));

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  await migrate().catch((err) => console.error('Migration error:', err.message));
  startSweeper();
  app.listen(PORT, '0.0.0.0', () => {
    console.log("Server running on port " + PORT);
  });
});

