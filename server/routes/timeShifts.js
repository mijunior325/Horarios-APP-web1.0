const express = require('express');
const router = express.Router();
const { getTimeShifts } = require('../services/timeShiftService');

// GET /api/timeShifts?userId=xxx&username=xxx&startDate=xxx&endDate=xxx
router.get('/', async (req, res) => {
  try {
    const { userId, username, startDate, endDate } = req.query;
    const shifts = await getTimeShifts({ userId, username, startDate, endDate });
    res.json(shifts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
