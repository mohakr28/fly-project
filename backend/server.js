// backend/server.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cron = require("node-cron");
const connectDB = require("./config/db");

const { fetchAndProcessFlights } = require("./services/aviationStackService");
// استيراد الخدمة الجديدة
const { fetchAndStoreEvents } = require("./services/eventService");

dotenv.config();
const app = express();
connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/flights", require("./routes/api/flights"));

// المهمة الرئيسية (كل 15 دقيقة) لجلب بيانات الرحلات
console.log("Scheduling flight data job for every 15 minutes.");
cron.schedule("*/15 * * * *", () => {
  console.log("Cron job triggered: running fetchAndProcessFlights.");
  fetchAndProcessFlights();
});

// المهمة الثانوية (مرة كل يوم) لجلب بيانات الأحداث
console.log("Scheduling event data job for once a day.");
cron.schedule("0 2 * * *", () => {
  // Runs at 2:00 AM every day
  console.log("Daily cron job triggered: running fetchAndStoreEvents.");
  fetchAndStoreEvents();
});

// تشغيل جلب البيانات مرة واحدة عند بدء التشغيل
console.log("Performing initial data fetch on server startup...");
fetchAndProcessFlights();
fetchAndStoreEvents(); // Run once on startup to ensure demo data exists

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));
