// backend/routes/api/airports.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const auth = require("../../middleware/auth");
const MonitoredAirport = require("../../models/MonitoredAirport");

// Load the full list of European airports from the JSON file
const allEuropeanAirports = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../data/european_airports.json"), "utf8")
);

// @route   GET /api/airports/available
// @desc    Get all available European airports to choose from
// @access  Private
router.get("/available", auth, (req, res) => {
  res.json(allEuropeanAirports);
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
  const { icao } = req.body; // We only need the ICAO code from the client

  if (!icao) {
    return res.status(400).json({ msg: "Please provide an ICAO code" });
  }

  try {
    // Find the full airport details from our master list
    const airportToAdd = allEuropeanAirports.find(
      (airport) => airport.icao === icao.toUpperCase()
    );

    if (!airportToAdd) {
      return res.status(404).json({ msg: "Selected airport not found in the available list" });
    }

    // Check for duplicates in the monitored list
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
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;