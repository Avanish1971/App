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
const EmployeeDocument = require('../models/EmployeeDocument');
const SalarySlip = require('../models/SalarySlip');
const EmployeePhoto = require('../models/EmployeePhoto');
const Office = require('../models/Office');
const Shift = require('../models/Shift');
const { getBalance } = require('../utils/leaveBalance');
const { todayIST } = require('../utils/time');
const { broadcastAdmin, sendToEmployee } = require('../utils/realtime');

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

// GET /api/employees/:id/leave-balance?year=2026 -> quota, li hui, pending aur bachi leave
router.get('/:id/leave-balance', async (req, res) => {
  try {
    const employee = await Employee.findOne({ id: req.params.id });
    if (!employee) return res.status(404).json({ error: 'Employee nahi mila' });
    const year = /^\d{4}$/.test(String(req.query.year || '')) ? req.query.year : todayIST().slice(0, 4);
    res.json(await getBalance(employee, year));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/employees/:id/transfer  { officeId, shiftId?, reportingManager?, reason? }
// Employee ek branch se doosre me: ab usi branch ke radius me attendance lagegi aur wahi ke roster me dikhega.
router.put('/:id/transfer', async (req, res) => {
  try {
    const { officeId, shiftId, reportingManager, reason } = req.body || {};
    const employee = await Employee.findOne({ id: req.params.id });
    if (!employee) return res.status(404).json({ error: 'Employee nahi mila' });
    if (employee.status === 'INACTIVE') return res.status(400).json({ error: 'Deactivated employee ka transfer nahi ho sakta' });

    const newOffice = await Office.findOne({ id: officeId });
    if (!newOffice) return res.status(404).json({ error: 'Naya office/branch nahi mila' });
    if (employee.officeId === newOffice.id) return res.status(400).json({ error: 'Employee pehle se isi branch me hai' });

    if (shiftId && !(await Shift.findOne({ id: shiftId }))) {
      return res.status(404).json({ error: 'Shift nahi mili' });
    }

    // Abhi office me check-in hai to beech me branch badalne se attendance bigad jayegi
    const today = await AttendanceRecord.findOne({ employeeId: employee.id, date: todayIST() });
    if (today && today.checkInTime && !today.checkOutTime && ['PRESENT', 'ON_BREAK', 'ON_DUTY'].includes(today.status)) {
      return res.status(409).json({ error: 'Employee abhi office me check-in hai. Check-out ke baad transfer karo.' });
    }

    const oldOffice = await Office.findOne({ id: employee.officeId });
    employee.transferHistory.push({
      date: todayIST(),
      fromOfficeId: employee.officeId,
      fromOfficeName: oldOffice ? oldOffice.name : '',
      toOfficeId: newOffice.id,
      toOfficeName: newOffice.name,
      reason: String(reason || '').slice(0, 300),
    });
    employee.officeId = newOffice.id;
    employee.branch = newOffice.city;
    if (shiftId) employee.shiftId = shiftId;
    if (reportingManager && String(reportingManager).trim()) employee.reportingManager = String(reportingManager).trim();
    await employee.save();

    // Aaj ka record naye branch ke naam par (purane din purane branch ke hi rahenge)
    if (today) {
      today.officeId = newOffice.id;
      if (shiftId) today.shiftId = shiftId;
      await today.save();
      broadcastAdmin('attendance', { record: today.toObject() });
    }

    await audit(
      'EMPLOYEE_TRANSFER',
      employee,
      `Transfer: ${employee.fullName} (${employee.empId}) ${oldOffice ? oldOffice.name : '-'} -> ${newOffice.name}${reason ? `. Reason: ${reason}` : ''}`
    );
    sendToEmployee(employee.id, 'profile-updated', {}); // employee ka app naya branch turant le le
    res.json(employee);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    await EmployeeDocument.deleteMany({ employeeId: employee.id });
    await SalarySlip.deleteMany({ employeeId: employee.id });
    await EmployeePhoto.deleteMany({ employeeId: employee.id });
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
