// routes/api/flights.js
const express = require("express");
const router = express.Router();
const Flight = require("../../models/Flight");
const auth = require("../../middleware/auth");

// @route   GET /api/flights
// @desc    Get paginated and filtered flights
// @access  Private
router.get("/", auth, async (req, res) => {
  console.log("LOG: [GET /api/flights] Request received with query:", req.query);

  try {
    // 1. استخلاص معاملات الترقيم والفلترة من الطلب
    const {
      page = 1,
      limit = 12, // عدد العناصر في كل صفحة (يمكن تعديله)
      status,
      searchQuery,
      date,
      airline,
      minDelay,
      monitoredAirport,
    } = req.query;

    const filter = {};

    // 2. بناء كائن الفلترة لقاعدة البيانات بناءً على المعاملات
    if (status && status !== 'all') {
      // تحويل 'delayed' -> 'Delayed', 'cancelled' -> 'Cancelled'
      filter.status = status.charAt(0).toUpperCase() + status.slice(1);
    }
    if (searchQuery) {
      filter.flightNumber = { $regex: searchQuery, $options: "i" };
    }
    if (date) {
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);
      filter.scheduledDeparture = { $gte: startOfDay, $lte: endOfDay };
    }
    if (airline) {
      // يبحث عن رقم رحلة يبدأ برمز شركة الطيران
      filter.flightNumber = { ...filter.flightNumber, $regex: `^${airline}${filter.flightNumber?.$regex || '.*'}` , $options: "i"};
    }
    if (minDelay) {
      filter.delayDuration = { $gte: parseInt(minDelay, 10) };
    }
    if (monitoredAirport && monitoredAirport !== 'all') {
      filter.$or = [
          { departureAirport: monitoredAirport },
          { arrivalAirport: monitoredAirport }
      ];
    }
    
    console.log("LOG: [GET /api/flights] Constructed DB filter:", JSON.stringify(filter));

    // 3. تنفيذ استعلامين: واحد للعدد الإجمالي وواحد لبيانات الصفحة
    const totalFlights = await Flight.countDocuments(filter);
    const flights = await Flight.find(filter)
      .sort({ scheduledDeparture: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    console.log(`LOG: [GET /api/flights] Found ${totalFlights} total flights, sending page ${page} with ${flights.length} items.`);

    // 4. إرجاع البيانات مع معلومات الترقيم
    res.json({
      flights,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalFlights / limit),
      totalFlights,
    });

  } catch (err) {
    console.error("ERROR: [GET /api/flights] Server Error:", err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET /api/flights/details
// @desc    Get details for a specific flight by flight number and date
// @access  Private
router.get("/details", auth, async (req, res) => {
  const { flightNumber, date } = req.query;

  if (!flightNumber || !date) {
    return res
      .status(400)
      .json({ msg: "Please provide both flightNumber and date." });
  }

  try {
    // 1. Build the date range for the specified day
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    // 2. Find the main flight by its flight number within that day
    const mainFlight = await Flight.findOne({
      flightNumber: { $regex: `^${flightNumber}$`, $options: "i" }, // Case-insensitive exact match
      scheduledDeparture: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    if (!mainFlight) {
      return res.status(404).json({ msg: "Flight not found for the specified number and date." });
    }

    // 3. Define the time window for contemporaneous flights (+/- 30 minutes)
    const timeWindowMinutes = 30;
    const scheduledTime = mainFlight.scheduledDeparture.getTime();
    const startTime = new Date(scheduledTime - timeWindowMinutes * 60 * 1000);
    const endTime = new Date(scheduledTime + timeWindowMinutes * 60 * 1000);

    // 4. Find other flights within that time window from the same departure airport
    const contemporaneousFlights = await Flight.find({
      _id: { $ne: mainFlight._id }, // Exclude the main flight itself
      departureAirport: mainFlight.departureAirport,
      scheduledDeparture: {
        $gte: startTime,
        $lte: endTime,
      },
    }).sort({ scheduledDeparture: 1 });

    // 5. Send the response
    res.json({
      mainFlight,
      contemporaneousFlights,
    });
  } catch (err) {
    console.error(`ERROR: [GET /api/flights/details] Server Error:`, err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET /api/flights/search
// @desc    Find flights by route and date, with optional time window and flight number
// @access  Private
router.get("/search", auth, async (req, res) => {
  const { departureAirport, arrivalAirport, date, time, timeWindow = '90', flightNumber } = req.query;

  if (!departureAirport || !arrivalAirport || !date) {
    return res.status(400).json({ msg: "Please provide departureAirport, arrivalAirport, and date." });
  }

  try {
    const filter = {
      departureAirport: departureAirport.toUpperCase(),
      arrivalAirport: arrivalAirport.toUpperCase(),
    };

    // إضافة فلتر رقم الرحلة إذا تم توفيره
    if (flightNumber) {
      filter.flightNumber = { $regex: `^${flightNumber}$`, $options: "i" };
    }

    if (time) {
      // Logic for searching within a time window
      console.log(`LOG: [GET /api/flights/search] Applying time window search.`);
      const timeWindowMinutes = parseInt(timeWindow, 10);
      const targetTime = new Date(`${date}T${time}:00.000Z`); // Assume time is provided in UTC HH:MM

      const startTime = new Date(targetTime.getTime() - timeWindowMinutes * 60 * 1000);
      const endTime = new Date(targetTime.getTime() + timeWindowMinutes * 60 * 1000);

      filter.scheduledDeparture = { $gte: startTime, $lte: endTime };

    } else {
      // Logic for searching the entire day
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);
      filter.scheduledDeparture = { $gte: startOfDay, $lte: endOfDay };
    }
    
    console.log("LOG: [GET /api/flights/search] Searching with filter:", JSON.stringify(filter));

    const flights = await Flight.find(filter).sort({ scheduledDeparture: 1 });
    res.json(flights);

  } catch (err) {
    console.error(`ERROR: [GET /api/flights/search] Server Error:`, err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET /api/flights/by-range
// @desc    Find flights on a specific route and all other contextual flights from the departure airport within a time range.
// @access  Private
router.get("/by-range", auth, async (req, res) => {
  const { departureAirport, arrivalAirport, startTime, endTime } = req.query;

  // 1. Validate inputs
  if (!departureAirport || !arrivalAirport || !startTime || !endTime) {
    return res.status(400).json({ msg: "Please provide departureAirport, arrivalAirport, startTime, and endTime." });
  }

  try {
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    // Check for invalid date strings
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ msg: "Invalid date format for startTime or endTime." });
    }

    const depIATA = departureAirport.toUpperCase();
    const arrIATA = arrivalAirport.toUpperCase();
    
    // 2. Find flights matching the specific route
    const routeFlights = await Flight.find({
      departureAirport: depIATA,
      arrivalAirport: arrIATA,
      scheduledDeparture: {
        $gte: startDate,
        $lte: endDate,
      },
    }).sort({ scheduledDeparture: 1 });

    // 3. Find all other flights from the same departure airport in the same time range
    const contextualFlights = await Flight.find({
      departureAirport: depIATA,
      arrivalAirport: { $ne: arrIATA }, // Exclude the flights on the specified route
      scheduledDeparture: {
        $gte: startDate,
        $lte: endDate,
      },
    }).sort({ scheduledDeparture: 1 });
    
    // 4. Send the structured response
    res.json({
      routeFlights,
      contextualFlights,
    });

  } catch (err) {
    console.error(`ERROR: [GET /api/flights/by-range] Server Error:`, err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;