// routes/api/flights.js
const express = require("express");
const router = express.Router();
const Flight = require("../../models/Flight");
const auth = require("../../middleware/auth"); // <-- 1. استيراد الـ middleware

// @route   GET /api/flights
// @desc    Get all relevant flights with filtering
// @access  Private (محمي الآن)
router.get("/", auth, async (req, res) => {
  // <-- 2. إضافة الـ middleware هنا
  try {
    const { flightDate, flightNumber, departureAirport } = req.query;

    const filter = {};

    // Build the filter object based on query parameters
    if (flightNumber) {
      // البحث عن أي رحلة "تحتوي" على النص المدخل (بحث جزئي وغير حساس لحالة الأحرف)
      filter.flightNumber = { $regex: flightNumber, $options: "i" };
    }
    if (departureAirport) {
      // البحث عن أي مطار "يحتوي" على النص المدخل
      filter.departureAirport = {
        $regex: departureAirport,
        $options: "i",
      };
    }

    // --- تعديل منطق فلتر التاريخ ---
    if (flightDate) {
      // flightDate هو سلسلة نصية مثل "2025-06-25"
      // ننشئ تاريخ بداية اليوم المحدد بالتوقيت العالمي (UTC)
      const startOfDay = new Date(`${flightDate}T00:00:00.000Z`);

      // ننشئ تاريخ نهاية اليوم المحدد بالتوقيت العالمي (UTC)
      const endOfDay = new Date(`${flightDate}T23:59:59.999Z`);

      // الآن نبحث عن أي رحلة يقع وقت مغادرتها المجدول (المخزن بـ UTC)
      // ضمن هذا النطاق الزمني ليوم كامل.
      filter.scheduledDeparture = {
        $gte: startOfDay,
        $lte: endOfDay,
      };
    }
    // --- نهاية التعديل ---

    // Fetch flights from DB, sorting by most recent
    const flights = await Flight.find(filter).sort({ scheduledDeparture: -1 });
    res.json(flights);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
