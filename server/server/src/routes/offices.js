// const express = require('express');
// const router = express.Router();
// const Office = require('../models/Office');

// router.get('/', async (req, res) => {
//   const offices = await Office.find();
//   res.json(offices);
// });

// // PUT /api/offices/:id/radius - update geofence radius
// router.put('/:id/radius', async (req, res) => {
//   const { radiusMeters } = req.body;
//   const office = await Office.findOneAndUpdate(
//     { id: req.params.id },
//     { radiusMeters },
//     { new: true }
//   );
//   if (!office) return res.status(404).json({ error: 'Office not found' });
//   res.json(office);
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const Office = require('../models/Office'); // आपके मॉडल का नाम

// 🔴 बिल्कुल पक्का कर लें: यहाँ केवल '/' होना चाहिए, '/api/offices' नहीं!
router.get('/', async (req, res) => {
  try {
    const offices = await Office.find();
    res.json(offices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;