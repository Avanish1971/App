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

// 🔴 बिल्कुल पक्का कर लें: यहाँ केवल '/' होना चाहिए, '/api/employees' नहीं!
router.get('/', async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;