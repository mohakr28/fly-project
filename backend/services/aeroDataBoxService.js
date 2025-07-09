// backend/services/aeroDataBoxService.js
const axios = require("axios");
const Flight = require("../models/Flight");
const Event = require("../models/Event");
const { getLiveTrackingData } = require("./openSkyService");
const { getLatestWeather, getWeatherAtTime } = require("./weatherService");

const AIRPORTS_TO_MONITOR = [{ icao: "EDDF", iata: "FRA", name: "Frankfurt" }];

const callAeroDataBox = async (endpoint) => {
  try {
    const options = {
      method: "GET",
      url: `https://prod.api.market/api/v1/aedbx/aerodatabox${endpoint}`,
      headers: { "x-magicapi-key": process.env.AERODATABOX_API_KEY },
    };
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error(
      `Error calling AeroDataBox:`,
      error.response?.data?.message || error.message
    );
    return null;
  }
};

const processAirport = async (airport) => {
  console.log(
    `\n--- Processing Airport: ${airport.name} (${airport.icao}) ---`
  );

  const toUtc = new Date();
  const fromUtc = new Date(toUtc.getTime() - 6 * 60 * 60 * 1000);
  const endpoint = `/flights/airports/icao/${airport.icao}/${fromUtc
    .toISOString()
    .slice(0, 16)}/${toUtc
    .toISOString()
    .slice(
      0,
      16
    )}?withCancelled=true&withCodeshared=false&withCargo=false&withPrivate=false&withLeg=true`;
  const flightData = await callAeroDataBox(endpoint);

  if (!flightData) return;

  const departures = (flightData.departures || []).map((f) => ({
    ...f,
    type: "departure",
  }));
  const arrivals = (flightData.arrivals || []).map((f) => ({
    ...f,
    type: "arrival",
  }));
  const flightsToProcess = [...departures, ...arrivals];

  console.log(
    `[${airport.icao}] Found ${flightsToProcess.length} total movements to analyze.`
  );
  let processedCount = 0;

  for (const flight of flightsToProcess) {
    const isCancelled = flight.status === "Canceled";
    const delayMinutes = flight.departure?.delayMinutes || 0;
    const isDelayed = flight.type === "departure" && delayMinutes > 180;

    if (!isCancelled && !isDelayed) continue;
    if (!flight.departure?.scheduledTime?.utc) continue;

    console.log(
      `[${airport.icao}] Processing relevant flight: ${
        flight.number
      }. Status: ${isCancelled ? "Cancelled" : "Delayed"}`
    );

    const existingFlight = await Flight.findOne({
      flightNumber: flight.number,
      scheduledDeparture: new Date(flight.departure.scheduledTime.utc),
    });

    let departureWeather = null;
    let arrivalWeather = null;
    let isWeatherLocked = existingFlight?.isWeatherLocked || false;

    if (!isWeatherLocked) {
      const departureAirportIcao =
        flight.departure?.airport?.icao ||
        (flight.type === "departure" ? airport.icao : undefined);
      const arrivalAirportIcao =
        flight.arrival?.airport?.icao ||
        (flight.type === "arrival" ? airport.icao : undefined);

      if (isCancelled) {
        console.log(
          `[${flight.number}] CANCELLED. Fetching weather at scheduled time to lock it.`
        );
        const scheduledTime = flight.departure.scheduledTime.utc;
        departureWeather = await getWeatherAtTime(
          departureAirportIcao,
          scheduledTime
        );
        arrivalWeather = await getWeatherAtTime(
          arrivalAirportIcao,
          scheduledTime
        );
        isWeatherLocked = true;
      } else if (isDelayed) {
        console.log(`[${flight.number}] DELAYED. Fetching latest weather.`);
        departureWeather = await getLatestWeather(departureAirportIcao);
        arrivalWeather = await getLatestWeather(arrivalAirportIcao);
      }
    } else {
      console.log(`[${flight.number}] Weather data is locked. Skipping fetch.`);
      departureWeather = existingFlight.weatherInfo?.departure;
      arrivalWeather = existingFlight.weatherInfo?.arrival;
    }

    const departureAirportIata =
      flight.departure?.airport?.iata ||
      (flight.type === "departure" ? airport.iata : undefined);
    const arrivalAirportIata =
      flight.arrival?.airport?.iata ||
      (flight.type === "arrival" ? airport.iata : undefined);
    const icao24 = flight.aircraft?.modeS;
    const liveData = icao24 ? await getLiveTrackingData(icao24) : null;

    let cancellationContext = null;
    if (isCancelled) {
      const flightDate = new Date(flight.departure.scheduledTime.utc);
      const relatedEvent = await Event.findOne({
        $or: [
          { affectedEntity: flight.airline?.iata },
          { affectedEntity: flight.airline?.icao },
        ],
        startDate: { $lte: flightDate },
        endDate: { $gte: flightDate },
        status: "approved",
      });
      if (relatedEvent) {
        cancellationContext = `Possible link to event: ${relatedEvent.summary}`;
      } else if (
        departureWeather?.condition &&
        (departureWeather.condition.includes("TS") ||
          departureWeather.condition.includes("FG"))
      ) {
        cancellationContext =
          "Potential cancellation due to adverse weather at departure airport.";
      }
    }

    const normalizedData = {
      flightNumber: flight.number,
      departureAirport: departureAirportIata,
      arrivalAirport: arrivalAirportIata,
      scheduledDeparture: new Date(flight.departure.scheduledTime.utc),
      actualDeparture: flight.departure?.actualTime?.utc
        ? new Date(flight.departure.actualTime.utc)
        : null,
      status: isCancelled ? "Cancelled" : "Delayed",
      delayDuration: delayMinutes,
      icao24,
      live: liveData,
      weatherInfo: { departure: departureWeather, arrival: arrivalWeather },
      isWeatherLocked,
      cancellationContext,
    };

    if (!normalizedData.departureAirport || !normalizedData.arrivalAirport)
      continue;

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
    `[${airport.icao}] Processing complete. Processed ${processedCount} relevant flights.`
  );
};

const fetchAndProcessFlights = async () => {
  console.log("Starting master flight data processing job...");
  for (const airport of AIRPORTS_TO_MONITOR) {
    try {
      await processAirport(airport);
    } catch (error) {
      console.error(
        `An error occurred while processing airport ${airport.name}:`,
        error
      );
    }
  }
  console.log("\nMaster flight data processing job finished.");
};

module.exports = { fetchAndProcessFlights };
