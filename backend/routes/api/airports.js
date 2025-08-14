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
// @desc    Get paginated and filtered list of available airports
// @access  Private
router.get("/available", auth, (req, res) => {
  // ✅ 1. استخلاص معاملات الترقيم والفلترة
  const { 
    page = 1, 
    limit = 20, // عدد أقل من المطارات في كل صفحة لأن القائمة طويلة
    query = '', 
    country = 'All' 
  } = req.query;

  const allAirports = getAvailableAirportsList();
  
  // ✅ 2. تطبيق الفلترة على القائمة الكاملة
  const lowercasedQuery = query.toLowerCase();
  const filteredAirports = allAirports.filter(airport => {
    const queryMatch = lowercasedQuery === '' ||
      airport.name.toLowerCase().includes(lowercasedQuery) ||
      airport.icao.toLowerCase().includes(lowercasedQuery) ||
      airport.iata.toLowerCase().includes(lowercasedQuery);
    
    const countryMatch = country === 'All' || airport.country === country;
    
    return queryMatch && countryMatch;
  });

  // ✅ 3. تطبيق الترقيم على النتائج المفلترة
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedAirports = filteredAirports.slice(startIndex, endIndex);

  const totalAirports = filteredAirports.length;
  const totalPages = Math.ceil(totalAirports / limit);

  // ✅ 4. إرجاع النتائج المرقّمة مع معلومات الترقيم
  res.json({
    airports: paginatedAirports,
    currentPage: parseInt(page),
    totalPages: totalPages,
    totalAirports: totalAirports
  });
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



// @route   GET /api/airports/countries
// @desc    Get a unique list of all available countries
// @access  Private
router.get("/countries", auth, (req, res) => {
    const allAirports = getAvailableAirportsList();
    const countries = [...new Set(allAirports.map(airport => airport.country))];
    countries.sort();
    res.json(countries);
});

// @route   GET /api/airports/available
// @desc    Get paginated and filtered list of available airports
// @access  Private
router.get("/available", auth, (req, res) => {
  const { 
    page = 1, 
    limit = 20,
    query = '', 
    country = 'All' 
  } = req.query;

  const allAirports = getAvailableAirportsList();
  
  const lowercasedQuery = query.toLowerCase();
  const filteredAirports = allAirports.filter(airport => {
    const queryMatch = lowercasedQuery === '' ||
      airport.name.toLowerCase().includes(lowercasedQuery) ||
      airport.icao.toLowerCase().includes(lowercasedQuery) ||
      airport.iata.toLowerCase().includes(lowercasedQuery);
    
    // ✅ التأكد من أن اسم الدولة موجود قبل الفلترة
    const countryMatch = country === 'All' || (airport.country && airport.country === country);
    
    return queryMatch && countryMatch;
  });

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedAirports = filteredAirports.slice(startIndex, endIndex);

  const totalAirports = filteredAirports.length;
  const totalPages = Math.ceil(totalAirports / limit);

  res.json({
    airports: paginatedAirports,
    currentPage: parseInt(page),
    totalPages: totalPages,
    totalAirports: totalAirports
  });
});

module.exports = router;