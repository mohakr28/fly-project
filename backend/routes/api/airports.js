// backend/routes/api/airports.js
const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const MonitoredAirport = require("../../models/MonitoredAirport");
const { getAirportDetailsMap, getAvailableAirportsList } = require("../../services/airportDataService");

// @route   GET /api/airports/details
// @desc    Get a map of all airport details (IATA -> {name, timezone})
// @access  Private
router.get("/details", auth, (req, res) => {
  const airportMap = getAirportDetailsMap();
  res.json(airportMap);
});

// @route   GET /api/airports/available
// @desc    Get all available large/medium airports to choose from
// @access  Private
router.get("/available", auth, (req, res) => {
  // ✅ 1. استبدال الملف الثابت بالقائمة الديناميكية
  const allAirports = getAvailableAirportsList();
  res.json(allAirports);
});

// @route   GET /api/airports
// @desc    Get all currently monitored airports
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const airports = await MonitoredAirport.find().sort({ name: 1 });
    res.json(airports);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   POST /api/airports
// @desc    Add a new airport to monitor from the available list
// @access  Private
router.post("/", auth, async (req, res) => {
  const { icao } = req.body;

  if (!icao) {
    return res.status(400).json({ msg: "Please provide an ICAO code" });
  }

  try {
    // ✅ 2. البحث في القائمة الديناميكية الكاملة بدلاً من الملف القديم
    const allAirports = getAvailableAirportsList();
    const airportToAdd = allAirports.find(
      (airport) => airport.icao === icao.toUpperCase()
    );

    if (!airportToAdd) {
      return res.status(404).json({ msg: "Selected airport not found in the available list" });
    }

    let alreadyMonitored = await MonitoredAirport.findOne({ icao: airportToAdd.icao });
    if (alreadyMonitored) {
      return res.status(400).json({ msg: "This airport is already being monitored" });
    }

    const newAirport = new MonitoredAirport({
      icao: airportToAdd.icao,
      iata: airportToAdd.iata,
      name: airportToAdd.name,
    });

    await newAirport.save();
    res.status(201).json(newAirport);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   DELETE /api/airports/:id
// @desc    Delete a monitored airport
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const airport = await MonitoredAirport.findById(req.params.id);
    if (!airport) {
      return res.status(404).json({ msg: "Airport not found" });
    }
    await MonitoredAirport.findByIdAndDelete(req.params.id);
    res.json({ msg: "Airport removed" });
  } catch (err)
    {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;