// const express = require('express');
// const router = express.Router();
// const Shift = require('../models/Shift');

// router.get('/', async (req, res) => {
//   const shifts = await Shift.find();
//   res.json(shifts);
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const Shift = require('../models/Shift'); // आपका शिफ्ट मॉडल

// 🔴 सबसे ज़रूरी चेक: रास्ता केवल '/' होना चाहिए, '/api/shifts' नहीं!
router.get('/', async (req, res) => {
  try {
    const shifts = await Shift.find();
    res.json(shifts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;