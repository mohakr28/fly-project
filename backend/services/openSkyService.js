// backend/services/openSkyService.js
const axios = require("axios");

const getLiveTrackingData = async (icao24) => {
  if (!icao24) {
    return null;
  }
  
  const url = "https://opensky-network.org/api/states/all";
  console.log(`LOG: [OpenSky] Fetching live data for icao24: ${icao24}`);

  try {
    const response = await axios.get(
      url,
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
      console.log(`LOG: [OpenSky] No state vector found for icao24: ${icao24}`);
      return null;
    }
    
    // console.log(`LOG: [OpenSky] Received state vector for ${icao24}:`, stateVector);

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
    
    const liveData = {
      onGround: onGround,
      latitude: latitude,
      longitude: longitude,
      altitude: altitudeFt,
      velocity: velocityKmh,
      verticalRate: verticalRate,
      callsign: callsign?.trim(),
      lastUpdated: new Date(lastContact * 1000),
    };
    
    console.log(`LOG: [OpenSky] Successfully processed live data for ${icao24}. On ground: ${onGround}`);
    return liveData;

  } catch (error) {
    console.error(
      `ERROR: [OpenSky] Could not fetch live data for icao24 ${icao24}:`,
      error.message
    );
    return null;
  }
};

module.exports = { getLiveTrackingData };