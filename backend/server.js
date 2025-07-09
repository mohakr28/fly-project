// backend/server.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cron = require("node-cron");
const connectDB = require("./config/db");

// --- تعديل مهم ---
// استيراد الخدمة الجديدة بدلاً من القديمة
const { fetchAndProcessFlights } = require("./services/aeroDataBoxService");
// -----------------

// استيراد خدمة الأحداث
const { fetchAndStoreEvents } = require("./services/eventService");

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/flights", require("./routes/api/flights"));
// --- ✅ إضافة السطر الجديد هنا ---
app.use("/api/events", require("./routes/api/events"));
// ------------------------------

const startApp = async () => {
  try {
    // انتظر حتى يتم الاتصال بقاعدة البيانات بنجاح
    await connectDB();

    // المهمة الرئيسية (كل 15 دقيقة) لجلب بيانات الرحلات من AeroDataBox
    console.log("Scheduling flight data job for every 15 minutes.");
    cron.schedule("*/15 * * * *", () => {
      console.log(
        "Cron job triggered: running fetchAndProcessFlights from AeroDataBox."
      );
      fetchAndProcessFlights();
    });

    // المهمة الثانوية (مرة كل يوم) لجلب بيانات الأحداث
    console.log("Scheduling event data job for once a day.");
    cron.schedule("0 2 * * *", () => {
      // Runs at 2:00 AM every day
      console.log("Daily cron job triggered: running fetchAndStoreEvents.");
      fetchAndStoreEvents();
    });

    // تشغيل جلب البيانات مرة واحدة عند بدء التشغيل لأغراض الاختبار
    console.log("Performing initial data fetch on server startup...");
    // يجب تشغيلها بالترتيب لضمان وجود بيانات الأحداث قبل معالجة الرحلات
    await fetchAndStoreEvents();
    await fetchAndProcessFlights();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () =>
      console.log(`Backend server running on port ${PORT}`)
    );
  } catch (error) {
    console.error("Failed to start the server:", error);
    process.exit(1);
  }
};

startApp();
