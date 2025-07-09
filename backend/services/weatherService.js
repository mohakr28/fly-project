// backend/services/weatherService.js
const axios = require("axios");
const metarParser = require("metar-parser");

const KNOTS_TO_KMH = 1.852;

// ✅ دالة مساعدة جديدة لتهيئة التاريخ بالشكل الصحيح الذي يتطلبه الـ API
const formatDateForApi = (date) => {
  const pad = (num) => num.toString().padStart(2, "0");

  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());

  return `${year}${month}${day}_${hours}${minutes}`;
};

// دالة لجلب أحدث تقرير طقس (للحالات المتأخرة)
const getLatestWeather = async (icaoCode) => {
  if (!icaoCode) return null;
  try {
    const response = await axios.get(
      "https://aviationweather.gov/api/data/metar",
      {
        params: {
          ids: icaoCode.toUpperCase(),
          format: "json",
          taf: "false",
        },
        timeout: 7000,
      }
    );

    if (!response.data || response.data.length === 0) return null;
    const metarString = response.data[0]?.rawOb;
    if (!metarString) return null;

    const parsedData = metarParser(metarString);
    if (!parsedData) return null;

    return {
      condition: metarString,
      temperature: parsedData.temperature?.celsius,
      windSpeed:
        typeof parsedData.wind?.speedKt === "number"
          ? Math.round(parsedData.wind.speedKt * KNOTS_TO_KMH)
          : undefined,
    };
  } catch (error) {
    console.error(
      `Failed to fetch latest weather for ${icaoCode}:`,
      error.message
    );
    return null;
  }
};

// دالة لجلب الطقس الأقرب لوقت محدد (للحالات الملغاة)
const getWeatherAtTime = async (icaoCode, targetTimeISO) => {
  if (!icaoCode || !targetTimeISO) return null;

  const targetTime = new Date(targetTimeISO);

  // لا يمكننا جلب بيانات تاريخية من المستقبل
  if (targetTime > new Date()) return null;

  try {
    // --- ✅ التحول إلى الـ API الجديد مع استخدام معلمات دقيقة ---
    const response = await axios.get(
      "https://aviationweather.gov/api/data/metar",
      {
        params: {
          ids: icaoCode.toUpperCase(),
          format: "json",
          // تحديد وقت النهاية للبحث
          date: formatDateForApi(targetTime),
          // البحث في الساعة والنصف التي تسبق وقت النهاية
          hoursBefore: 1.5,
          // طلب أحدث تقرير فقط لكل محطة
          mostRecentForEachStation: "true",
        },
        timeout: 10000, // زيادة المهلة للطلبات التاريخية
      }
    );
    // --------------------------------------------------------

    if (!response.data || response.data.length === 0) {
      console.warn(
        `No historical METAR data found for ${icaoCode} around ${targetTimeISO}.`
      );
      return null;
    }

    // بما أننا طلبنا الأحدث فقط، فالتقرير المطلوب هو الأول في المصفوفة
    const latestReport = response.data[0];
    if (!latestReport || !latestReport.rawOb) return null;

    const metarString = latestReport.rawOb;
    const parsedData = metarParser(metarString);
    if (!parsedData) return null;

    return {
      condition: metarString,
      temperature: parsedData.temperature?.celsius,
      windSpeed:
        typeof parsedData.wind?.speedKt === "number"
          ? Math.round(parsedData.wind.speedKt * KNOTS_TO_KMH)
          : undefined,
    };
  } catch (error) {
    console.error(
      `Failed to fetch historical weather for ${icaoCode}:`,
      error.message
    );
    return null;
  }
};

module.exports = { getLatestWeather, getWeatherAtTime };
