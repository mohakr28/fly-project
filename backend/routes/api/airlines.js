// backend/routes/api/airlines.js
const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const { getAvailableAirlines } = require("../../services/airlineDataService");

// @route   GET /api/airlines/available
// @desc    Get a list of available airlines, optionally filtered by a search query
// @access  Private
router.get("/available", auth, (req, res) => {
  try {
    const { query } = req.query; // استخلاص معامل البحث
    console.log(`LOG: [Airlines Route] Received request for available airlines with query: "${query || ''}"`);
    const airlines = getAvailableAirlines(query);
    res.json(airlines);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;