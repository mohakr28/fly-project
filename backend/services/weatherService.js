// backend/services/weatherService.js
const axios = require("axios");
const metarParser = require("metar-parser");

const KNOTS_TO_KMH = 1.852;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * يجلب أحدث تقرير طقس (METAR) متوفر للمطار المحدد.
 * @param {string} icaoCode - رمز المطار.
 * @returns {Promise<object|null>} - كائن الطقس المهيكل أو null.
 */
const getWeatherFromAviationGov = async (icaoCode) => {
  if (!icaoCode) {
    return null;
  }

  const maxRetries = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.get(
        "https://aviationweather.gov/api/data/metar",
        {
          params: {
            ids: icaoCode.toUpperCase(),
            format: "json",
            taf: "false",
          },
          headers: {
            "User-Agent": "FlightDashboard/1.0 (contact@example.com)",
          },
          timeout: 7000,
        }
      );

      if (!response.data || response.data.length === 0) {
        return null;
      }

      const metarString = response.data[0]?.rawOb;
      if (!metarString) {
        console.warn(`'rawOb' property not found in response for ${icaoCode}`);
        return null;
      }

      const parsedData = metarParser(metarString);
      if (!parsedData) {
        console.warn(
          `Failed to parse METAR string for ${icaoCode}: ${metarString}`
        );
        return null;
      }

      return {
        condition: metarString,
        temperature: parsedData.temperature?.celsius,
        windSpeed:
          typeof parsedData.wind?.speedKt === "number"
            ? Math.round(parsedData.wind.speedKt * KNOTS_TO_KMH)
            : undefined,
      };
    } catch (error) {
      lastError = error;
      console.warn(
        `[Attempt ${attempt}/${maxRetries}] Failed to fetch weather for ${icaoCode}: ${error.message}. Retrying...`
      );
      await sleep(attempt * 1000);
    }
  }

  console.error(
    `All attempts failed for ${icaoCode}. Last error:`,
    lastError.message
  );
  return null;
};

module.exports = { getWeatherFromAviationGov };
