// backend/routes/api/airlines.js
const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const { getAvailableAirlines } = require("../../services/airlineDataService");

// @route   GET /api/airlines/available
// @desc    Get a list of all available airlines for filtering
// @access  Private
router.get("/available", auth, (req, res) => {
  try {
    const airlines = getAvailableAirlines();
    res.json(airlines);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;