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

module.exports = router;