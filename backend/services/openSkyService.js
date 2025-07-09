// backend/services/openSkyService.js
const axios = require("axios");

/**
 * Fetches live tracking data for a specific aircraft from OpenSky Network.
 * @param {string} icao24 - The unique ICAO 24-bit transponder address of the aircraft.
 * @returns {object|null} - Live data object or null if not found.
 */
const getLiveTrackingData = async (icao24) => {
  if (!icao24) {
    return null;
  }

  try {
    const response = await axios.get(
      "https://opensky-network.org/api/states/all",
      {
        params: { icao24: icao24.toLowerCase() },
        headers: {
          // استخدام User-Agent يحاكي متصفحًا لتجنب الحظر (Error 403)
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
        timeout: 8000, // مهلة زمنية للطلب
      }
    );

    const stateVector = response.data.states?.[0];

    if (!stateVector) {
      // طبيعي، الطائرة قد تكون على الأرض أو خارج التغطية
      return null;
    }

    // --- ✅ التحسين الرئيسي: استخدام Destructuring لتجنب "الأرقام السحرية" ---
    // هذا يجعل الكود أكثر قابلية للقراءة والصيانة.
    // كل متغير الآن له اسم واضح يصف محتواه بناءً على توثيق OpenSky API.
    const [
      icao,
      callsign, // e.g., "SAS1447"
      originCountry,
      timePosition,
      lastContact,
      longitude,
      latitude,
      baroAltitude, // Altitude in meters
      onGround,
      velocity, // Speed in meters/second
      trueTrack, // Flight direction in degrees
      verticalRate, // In meters/second. Negative = descending, Positive = ascending
      sensors,
      geoAltitude,
      squawk,
      spi,
      positionSource,
    ] = stateVector;
    // ----------------------------------------------------------------------

    // --- ✅ تحسين 2: تحويل الوحدات وإضافة بيانات مفيدة ---
    // تحويل الارتفاع من أمتار إلى أقدام (الوحدة المتعارف عليها في الطيران)
    const altitudeFt = baroAltitude ? Math.round(baroAltitude * 3.28084) : 0;
    // تحويل السرعة من متر/ثانية إلى كيلومتر/ساعة
    const velocityKmh = velocity ? Math.round(velocity * 3.6) : 0;

    // بناء كائن JSON نظيف ومنظم لإعادته
    return {
      onGround: onGround,
      latitude: latitude,
      longitude: longitude,
      altitude: altitudeFt, // إرجاع الارتفاع بالأقدام
      velocity: velocityKmh, // إرجاع السرعة بـ كم/ساعة
      verticalRate: verticalRate, // معدل الصعود/الهبوط
      callsign: callsign?.trim(), // رقم النداء (غالبًا رقم الرحلة)
      lastUpdated: new Date(lastContact * 1000),
    };
  } catch (error) {
    // لا بأس إذا فشل الطلب، قد تكون الشبكة غير مستقرة. نسجل الخطأ ونكمل.
    console.error(
      `Could not fetch live data for icao24 ${icao24}:`,
      error.message
    );
    return null;
  }
};

module.exports = { getLiveTrackingData };
