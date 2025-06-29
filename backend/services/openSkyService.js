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
    // OpenSky's 'states' endpoint gives current state vectors for aircraft.
    const response = await axios.get(
      `https://opensky-network.org/api/states/all`,
      {
        params: {
          icao24: icao24.toLowerCase(), // API expects lowercase
        },
      }
    );

    // The 'states' array contains the flight data if found.
    const stateVector = response.data.states?.[0];

    if (!stateVector) {
      // The aircraft is likely not airborne or out of range.
      return null;
    }

    // stateVector format: [icao24, callsign, origin_country, time_position, last_contact,
    // longitude, latitude, baro_altitude, on_ground, velocity, true_track, vertical_rate,
    // sensors, geo_altitude, squawk, spi, position_source]
    return {
      onGround: stateVector[8],
      latitude: stateVector[6],
      longitude: stateVector[5],
      altitude: stateVector[7], // Barometric altitude in meters
      lastUpdated: new Date(stateVector[4] * 1000),
    };
  } catch (error) {
    // It's okay if we can't find live data, just log and continue.
    console.error(
      `Could not fetch live data for icao24 ${icao24}:`,
      error.message
    );
    return null;
  }
};

module.exports = { getLiveTrackingData };
