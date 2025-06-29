// backend/services/aviationStackService.js
const axios = require("axios");
const Flight = require("../models/Flight");
const Event = require("../models/Event"); // استيراد نموذج الحدث
const { getLiveTrackingData } = require("./openSkyService");
const { getWeatherForAirport } = require("./weatherService"); // استيراد خدمة الطقس

const fetchAndProcessFlights = async () => {
  console.log("Starting flight data fetch from AviationStack...");
  try {
    const response = await axios.get(
      "http://api.aviationstack.com/v1/flights",
      { params: { access_key: process.env.AVIATIONSTACK_API_KEY } }
    );
    const flights = response.data.data;
    let processedCount = 0;

    for (const flight of flights) {
      const isCancelled = flight.flight_status === "cancelled";
      const delay = flight.departure.delay || 0;
      const isDelayed = delay > 180;

      if (!isCancelled && !isDelayed) continue;

      // --- مرحلة الإثراء ---
      // 1. إثراء بيانات الموقع
      const icao24 = flight.aircraft?.icao;
      const liveData = icao24 ? await getLiveTrackingData(icao24) : null;

      // 2. إثراء بيانات الطقس
      const departureWeather = await getWeatherForAirport(
        flight.departure.iata
      );
      const arrivalWeather = await getWeatherForAirport(flight.arrival.iata);

      // 3. إثراء بيانات سياق الإلغاء
      let cancellationContext = null;
      if (isCancelled && flight.airline?.iata) {
        const flightDate = new Date(flight.departure.scheduled);
        const relatedEvent = await Event.findOne({
          affectedEntity: flight.airline.iata,
          startDate: { $lte: flightDate },
          endDate: { $gte: flightDate },
        });
        if (relatedEvent) {
          cancellationContext = `Possible link to event: ${relatedEvent.summary}`;
        }
      }
      // --- نهاية مرحلة الإثراء ---

      const normalizedData = {
        flightNumber: flight.flight.iata,
        departureAirport: flight.departure.iata,
        arrivalAirport: flight.arrival.iata,
        scheduledDeparture: new Date(flight.departure.scheduled),
        actualDeparture: flight.departure.actual
          ? new Date(flight.departure.actual)
          : null,
        status: isCancelled ? "Cancelled" : "Delayed",
        delayDuration: delay,
        icao24: icao24,
        live: liveData,
        weatherInfo: {
          departure: departureWeather,
          arrival: arrivalWeather,
        },
        cancellationContext: cancellationContext,
      };

      await Flight.findOneAndUpdate(
        {
          flightNumber: normalizedData.flightNumber,
          scheduledDeparture: normalizedData.scheduledDeparture,
        },
        normalizedData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      processedCount++;
    }
    console.log(
      `Flight data processing complete. Processed ${processedCount} relevant flights.`
    );
  } catch (error) {
    if (error.response) {
      console.error(
        "Error fetching data from AviationStack:",
        error.response.data
      );
    } else {
      console.error("Error in fetchAndProcessFlights:", error.message);
    }
  }
};

module.exports = { fetchAndProcessFlights };
