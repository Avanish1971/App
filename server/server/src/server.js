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
const eventsRouter = require('./routes/events');
const { requireRole, attendanceGuard, requestsGuard } = require('./middleware/auth');

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000' }));
// Document upload ke liye bada body chahiye (sirf us route par); baaki sab jagah chhota limit
const DOC_ROUTE = /^\/api\/(employees\/[^/]+\/documents|me\/client-visits)/;
const smallJson = express.json();
app.use((req, res, next) => (DOC_ROUTE.test(req.path) ? next() : smallJson(req, res, next)));

app.get('/', (req, res) => res.json({ status: 'ok', message: 'location_app API running' }));

// Login ke bina kuch nahi: admin ke kaam sirf admin token se, employee sirf apna data
const admin = requireRole('admin');
app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter); // live stream (token URL me, route khud verify karta hai)
app.use('/api/me/client-visits', requireRole('employee'), express.json({ limit: '6mb' })); // photos wala bada body
app.use('/api/me', requireRole('employee'), meRouter);
app.use('/api/messages', admin, messagesRouter);
app.use('/api/client-visits', admin, clientVisitsRouter);
app.use('/api/employees/:id/documents', admin, express.json({ limit: '6mb' }), employeeDocumentsRouter);
app.use('/api/employees', admin, employeesRouter);
app.use('/api/offices', admin, officesRouter);
app.use('/api/shifts', admin, shiftsRouter);
app.use('/api/attendance', attendanceGuard, attendanceRouter);
app.use('/api/leaves', requestsGuard, leavesRouter);
app.use('/api/regularizations', requestsGuard, regularizationsRouter);
app.use('/api/expenses', admin, expensesRouter);
app.use('/api/audit-logs', admin, auditLogsRouter);
app.use('/api/policy', admin, policyRouter);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  startSweeper();
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
});