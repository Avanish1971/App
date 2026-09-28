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

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());

app.get('/', (req, res) => res.json({ status: 'ok', message: 'location_app API running' }));

app.use('/api/employees', employeesRouter);
app.use('/api/offices', officesRouter);
app.use('/api/shifts', shiftsRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/leaves', leavesRouter);
app.use('/api/regularizations', regularizationsRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/audit-logs', auditLogsRouter);
app.use('/api/policy', policyRouter);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
});
