// backend/services/weatherService.js
const axios = require("axios");

/**
 * NOTE: This is a placeholder service. A real implementation would require:
 * 1. API keys for a weather service (like Google, OpenWeatherMap, etc.).
 * 2. Logic to convert an airport IATA code to coordinates (lat/lon).
 * 3. Actual API calls.
 *
 * For now, it returns mock data to demonstrate the structure.
 */
const getWeatherForAirport = async (airportIata) => {
  console.log(`> Fetching weather for airport: ${airportIata}`);
  if (!airportIata) return null;

  // In a real application, you would make an API call here.
  // const response = await axios.get(`https://api.weather.com/v1/...?airport=${airportIata}`);

  // Returning mock data for demonstration purposes.
  try {
    const mockConditions = [
      "Clear Sky",
      "Light Rain",
      "Thunderstorm",
      "Heavy Snow",
    ];
    const randomCondition =
      mockConditions[Math.floor(Math.random() * mockConditions.length)];

    return {
      condition: randomCondition,
      temperature: parseFloat((Math.random() * 30).toFixed(1)), // Temp in Celsius
      windSpeed: parseFloat((Math.random() * 40).toFixed(1)), // Wind in km/h
    };
  } catch (error) {
    console.error(`Could not fetch weather for ${airportIata}:`, error.message);
    return null;
  }
};

module.exports = { getWeatherForAirport };
