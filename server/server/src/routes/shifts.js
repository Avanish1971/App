const express = require('express');
const router = express.Router();
const Shift = require('../models/Shift');

router.get('/', async (req, res) => {
  const shifts = await Shift.find();
  res.json(shifts);
});

module.exports = router;
