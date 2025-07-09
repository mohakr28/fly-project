// backend/services/weatherService.js
const axios = require("axios");
const metarParser = require("metar-parser");

const KNOTS_TO_KMH = 1.852;
const MILES_TO_METERS = 1609.34;

const formatDateForApi = (date) => {
  const pad = (num) => num.toString().padStart(2, "0");
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  return `${year}${month}${day}_${hours}${minutes}`;
};

const getTAF = async (icaoCode) => {
  if (!icaoCode) return null;
  try {
    const response = await axios.get(
      "https://aviationweather.gov/api/data/dataserver",
      {
        params: {
          requestType: "retrieve",
          dataSource: "tafs",
          stationString: icaoCode.toUpperCase(),
          hoursBeforeNow: 4,
          format: "json",
          mostRecent: "true",
        },
        timeout: 8000,
      }
    );
    return response.data?.[0]?.rawTaf || null;
  } catch (error) {
    console.error(`Failed to fetch TAF for ${icaoCode}: ${error.message}`);
    return null;
  }
};

const processWeatherData = (metarData) => {
  if (!metarData || !metarData.rawOb) return null;
  const metarString = metarData.rawOb;
  const parsedData = metarParser(metarString);
  if (!parsedData) return null;

  // --- ✅ الإصلاح النهائي هنا ---
  // 1. استخدام الحقل الصحيح `visib` بدلاً من `visib_sm`.
  // 2. التحقق من أنه يحتوي على قيمة رقمية قبل تحويلها.
  const visibilityInMeters =
    metarData.visib && !isNaN(parseFloat(metarData.visib))
      ? Math.round(parseFloat(metarData.visib) * MILES_TO_METERS)
      : parsedData.visibility?.meters_float; // الخيار البديل

  return {
    condition: metarString,
    temperature: parsedData.temperature?.celsius,
    windSpeed:
      typeof parsedData.wind?.speedKt === "number"
        ? Math.round(parsedData.wind.speedKt * KNOTS_TO_KMH)
        : undefined,
    visibility: visibilityInMeters, // الآن سيتم حفظ القيمة الصحيحة
    cloudLayers: (parsedData.clouds || []).map((c) => ({
      cover: c.code,
      height: c.altitude,
    })),
    // لا نحتاج لجلب الـ TAF حاليا لأنه لا يستخدم
    // taf: tafString,
  };
};

const getLatestWeather = async (icaoCode) => {
  if (!icaoCode) return null;
  try {
    const response = await axios.get(
      "https://aviationweather.gov/api/data/metar",
      {
        params: {
          ids: icaoCode.toUpperCase(),
          format: "json",
          mostRecentForEachStation: "true",
        },
        timeout: 7000,
      }
    );
    const metarData = response.data?.[0];
    return processWeatherData(metarData);
  } catch (error) {
    console.error(
      `Failed to fetch latest weather for ${icaoCode}:`,
      error.message
    );
    return null;
  }
};

const getWeatherAtTime = async (icaoCode, targetTimeISO) => {
  if (!icaoCode || !targetTimeISO) return null;
  const targetTime = new Date(targetTimeISO);
  if (targetTime > new Date()) return null;

  try {
    const response = await axios.get(
      "https://aviationweather.gov/api/data/metar",
      {
        params: {
          ids: icaoCode.toUpperCase(),
          format: "json",
          date: formatDateForApi(targetTime),
          hoursBefore: 1.5,
          mostRecentForEachStation: "true",
        },
        timeout: 10000,
      }
    );
    const metarData = response.data?.[0];
    return processWeatherData(metarData);
  } catch (error) {
    console.error(
      `Failed to fetch historical weather for ${icaoCode}:`,
      error.message
    );
    return null;
  }
};

module.exports = { getLatestWeather, getWeatherAtTime };
