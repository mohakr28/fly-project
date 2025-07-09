// backend/services/openSkyService.js
const axios = require("axios");

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
          // --- ✅ تحديث User-Agent إلى واحد أكثر حداثة لتجنب الخطأ 403 ---
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
        },
        timeout: 8000,
      }
    );

    const stateVector = response.data.states?.[0];

    if (!stateVector) {
      return null;
    }

    const [
      icao,
      callsign,
      originCountry,
      timePosition,
      lastContact,
      longitude,
      latitude,
      baroAltitude,
      onGround,
      velocity,
      trueTrack,
      verticalRate,
      sensors,
      geoAltitude,
    ] = stateVector;

    const altitudeFt = baroAltitude ? Math.round(baroAltitude * 3.28084) : 0;
    const velocityKmh = velocity ? Math.round(velocity * 3.6) : 0;

    return {
      onGround: onGround,
      latitude: latitude,
      longitude: longitude,
      altitude: altitudeFt,
      velocity: velocityKmh,
      verticalRate: verticalRate,
      callsign: callsign?.trim(),
      lastUpdated: new Date(lastContact * 1000),
    };
  } catch (error) {
    console.error(
      `Could not fetch live data for icao24 ${icao24}:`,
      error.message
    );
    return null;
  }
};

module.exports = { getLiveTrackingData };
