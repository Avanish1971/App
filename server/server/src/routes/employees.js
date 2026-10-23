// const express = require('express');
// const router = express.Router();
// const Employee = require('../models/Employee');

// // GET /api/employees - list all
// router.get('/', async (req, res) => {
//   const employees = await Employee.find().sort({ empId: 1 });
//   res.json(employees);
// });

// // POST /api/employees - add new employee
// router.post('/', async (req, res) => {
//   try {
//     const employee = await Employee.create(req.body);
//     res.status(201).json(employee);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });

// // PUT /api/employees/:id/status - activate/deactivate
// router.put('/:id/status', async (req, res) => {
//   const { status, reason } = req.body; // 'ACTIVE' | 'INACTIVE'
//   const employee = await Employee.findOneAndUpdate(
//     { id: req.params.id },
//     { status },
//     { new: true }
//   );
//   if (!employee) return res.status(404).json({ error: 'Employee not found' });
//   res.json(employee);
// });

// module.exports = router;


const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const AttendanceRecord = require('../models/AttendanceRecord');
const LeaveRequest = require('../models/LeaveRequest');
const RegularizationRequest = require('../models/RegularizationRequest');
const ExpenseClaim = require('../models/ExpenseClaim');
const AuditLogEntry = require('../models/AuditLogEntry');

async function audit(action, employee, details) {
  try {
    await AuditLogEntry.create({
      id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' }),
      actor: 'Admin Console',
      role: 'Admin',
      action,
      entity: 'Employee',
      entityId: employee.id,
      details,
      ipAddress: '-',
    });
  } catch (e) {
    // audit fail ho to bhi asli kaam rukna nahi chahiye
  }
}

// GET /api/employees - sab employees
router.get('/', async (req, res) => {
  try {
    res.json(await Employee.find().sort({ empId: 1 }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/employees - naya employee
router.post('/', async (req, res) => {
  try {
    const employee = await Employee.create(req.body);
    res.status(201).json(employee);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/employees/:id/status - ID activate / deactivate (profile bani rehti hai)
router.put('/:id/status', async (req, res) => {
  try {
    const { status, reason } = req.body || {};
    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({ error: "status 'ACTIVE' ya 'INACTIVE' hona chahiye" });
    }
    const update = { status, deactivationReason: status === 'INACTIVE' ? reason || '' : '' };
    const employee = await Employee.findOneAndUpdate({ id: req.params.id }, update, { new: true });
    if (!employee) return res.status(404).json({ error: 'Employee nahi mila' });
    res.json(employee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/employees/:id?confirm=<Employee ID>
// Employee ki poori profile + uska attendance, leave, regularization, expense record hamesha ke liye hat jata hai.
// confirm me us employee ki sahi Employee ID (jaise ACME-1010) dena zaroori hai, taaki galti se delete na ho.
router.delete('/:id', async (req, res) => {
  try {
    const employee = await Employee.findOne({ id: req.params.id });
    if (!employee) return res.status(404).json({ error: 'Employee nahi mila' });

    const confirm = String(req.query.confirm || '').trim().toLowerCase();
    if (confirm !== String(employee.empId).trim().toLowerCase()) {
      return res.status(400).json({ error: 'Confirmation ke liye sahi Employee ID likho' });
    }

    // Pehle uske records, phir profile
    const [att, leaves, regs, exps] = await Promise.all([
      AttendanceRecord.deleteMany({ employeeId: employee.id }),
      LeaveRequest.deleteMany({ employeeId: employee.id }),
      RegularizationRequest.deleteMany({ employeeId: employee.id }),
      ExpenseClaim.deleteMany({ employeeId: employee.id }),
    ]);
    await Employee.deleteOne({ id: employee.id });

    const deleted = {
      attendance: att.deletedCount || 0,
      leaves: leaves.deletedCount || 0,
      regularizations: regs.deletedCount || 0,
      expenses: exps.deletedCount || 0,
    };
    await audit(
      'EMPLOYEE_DELETE',
      employee,
      `Employee delete: ${employee.fullName} (${employee.empId}). Records hate: attendance ${deleted.attendance}, leave ${deleted.leaves}, regularization ${deleted.regularizations}, expense ${deleted.expenses}`
    );
    res.json({ ok: true, deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
