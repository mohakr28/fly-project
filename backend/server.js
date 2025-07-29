// backend/server.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cron = require("node-cron");
const connectDB = require("./config/db");
const bcrypt = require("bcryptjs"); // <-- استيراد bcryptjs
const User = require("./models/User"); // <-- استيراد نموذج المستخدم

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
app.use("/api/events", require("./routes/api/events"));
app.use("/api/auth", require("./routes/api/auth"));
// --- ✅ إضافة مسار المستخدمين الجديد ---
app.use("/api/users", require("./routes/api/users"));
// ------------------------------------

// --- ✅ دالة إنشاء المستخدم الافتراضي ---
const createDefaultAdmin = async () => {
  try {
    const adminEmail = "admin@admin.com";
    let adminUser = await User.findOne({ email: adminEmail });

    if (!adminUser) {
      console.log("Default admin user not found. Creating one...");
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("admin", salt);

      adminUser = new User({
        name: "admin",
        email: adminEmail,
        password: hashedPassword,
      });

      await adminUser.save();
      console.log(
        "Default admin user created with password 'admin'. Please change it immediately."
      );
    }
  } catch (error) {
    console.error("Error creating default admin user:", error);
    process.exit(1);
  }
};
// -----------------------------------------

const startApp = async () => {
  try {
    // انتظر حتى يتم الاتصال بقاعدة البيانات بنجاح
    await connectDB();

    // --- ✅ استدعاء الدالة هنا ---
    await createDefaultAdmin();

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
