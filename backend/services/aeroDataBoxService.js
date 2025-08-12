// backend/services/aeroDataBoxService.js
const axios = require("axios");
const Flight = require("../models/Flight");
const MonitoredAirport = require("../models/MonitoredAirport"); // ✅ استيراد النموذج الجديد
const { getLiveTrackingData } = require("./openSkyService");
const { getLatestWeather, getWeatherAtTime } = require("./weatherService");

// --- ✅ دوال مساعدة جديدة ومحسّنة ---

const safeToDate = (utcStr) => {
  if (!utcStr) return null;
  // إصلاح الفورمات "YYYY-MM-DD HH:MMZ" -> "YYYY-MM-DDTHH:MMZ"
  const fixed = utcStr.includes('T') ? utcStr : utcStr.replace(' ', 'T');
  const d = new Date(fixed);
  return isNaN(d.getTime()) ? null : d;
};

const getDelayMinutesForSide = (flight, sideName) => {
  // sideName = 'departure' أو 'arrival'
  const side = flight[sideName];
  if (!side) return null;

  // 1) استخدم delayMinutes إذا موجود
  if (typeof side.delayMinutes === 'number') {
    console.log(`LOG: [DelayCalc] Flight ${flight.number}: Found 'delayMinutes' field with value: ${side.delayMinutes}`);
    return side.delayMinutes;
  }

  // 2) حاول الحساب اليدوي: actualTime > revisedTime > runwayTime
  const scheduled = safeToDate(side.scheduledTime?.utc);
  const actual = safeToDate(side.actualTime?.utc);
  const revised = safeToDate(side.revisedTime?.utc);
  const runway = safeToDate(side.runwayTime?.utc);

  const reference = actual || revised || runway || null;

  if (!scheduled || !reference) {
    console.log(`LOG: [DelayCalc] Flight ${flight.number}: Could not calculate delay manually for side '${sideName}', missing time data.`);
    return null;
  }

  // فرق بالدقائق (يمكن أن يكون سالبًا إذا الرحلة مبكرة)
  const minutes = Math.round((reference.getTime() - scheduled.getTime()) / 60000);
  console.log(`LOG: [DelayCalc] Flight ${flight.number}: Manually calculated delay for side '${sideName}' is ${minutes} mins.`);
  return minutes;
};


// دالة مساعدة لتوليد الأعلام التحليلية
const generateAnalysisFlags = (flightData) => {
  const flags = {
    isWeatherSevere: false,
  };
  const depWeather = flightData.weatherInfo?.departure;
  if (depWeather) {
    if (
      (depWeather.visibility !== undefined && depWeather.visibility < 1500) ||
      depWeather.condition?.includes("TS")
    ) {
      flags.isWeatherSevere = true;
    }
  }
  return flags;
};

const callAeroDataBox = async (endpoint) => {
  try {
    const options = {
      method: "GET",
      url: `https://prod.api.market/api/v1/aedbx/aerodatabox${endpoint}`,
      headers: { "x-magicapi-key": process.env.AERODATABOX_API_KEY },
    };
    console.log(`LOG: [AeroDataBox] Calling endpoint: ${endpoint}`);
    const response = await axios.request(options);
    console.log(`LOG: [AeroDataBox] [RAW DATA] Received data:`, JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error(`ERROR: [AeroDataBox] Error calling endpoint ${endpoint}:`, error.response?.data?.message || error.message);
    return null;
  }
};

const processAirport = async (airport) => {
  console.log(`\n--- LOG: [AeroDataBox Service] Processing Airport: ${airport.name} (${airport.icao}) ---`);
  const toUtc = new Date();
  const fromUtc = new Date(toUtc.getTime() - 6 * 60 * 60 * 1000);
  const endpoint = `/flights/airports/icao/${airport.icao}/${fromUtc.toISOString().slice(0, 16)}/${toUtc.toISOString().slice(0, 16)}?withCancelled=true&withCodeshared=false&withCargo=false&withPrivate=false&withLeg=true`;
  const flightData = await callAeroDataBox(endpoint);
  if (!flightData) {
    console.log(`LOG: [AeroDataBox Service] No flight data returned for ${airport.icao}. Skipping.`);
    return;
  }
  const flightsToProcess = [
    ...(flightData.departures || []).map((f) => ({ ...f, type: "departure" })),
    ...(flightData.arrivals || []).map((f) => ({ ...f, type: "arrival" })),
  ];
  console.log(`LOG: [AeroDataBox Service] [${airport.icao}] Found ${flightsToProcess.length} total movements to analyze.`);
  let processedCount = 0;
  let relevantCount = 0;

  for (const flight of flightsToProcess) {
    const isCancelled = /cancel/i.test(flight.status || '');
    const sideName = flight.type === 'departure' ? 'departure' : 'arrival';
    const delayMinutes = getDelayMinutesForSide(flight, sideName);
    const isDelayed = delayMinutes !== null && delayMinutes > 180;

    if (!isCancelled && !isDelayed) continue;
    
    const scheduledUtc = (flight[sideName]?.scheduledTime?.utc) || null;
    if (!scheduledUtc) {
      console.warn(`LOG: Skipping ${flight.number} - no scheduled time on side '${sideName}'`);
      continue;
    }

    relevantCount++;
    console.log(`LOG: [AeroDataBox Service] [RAW RELEVANT FLIGHT DATA] Flight ${flight.number}:`, JSON.stringify(flight, null, 2));
    console.log(
      `LOG: [AeroDataBox Service] Processing relevant flight: ${
        flight.number
      }. Status: ${isCancelled ? "Cancelled" : `Delayed by ${delayMinutes} mins`}`
    );

    const existingFlight = await Flight.findOne({
      flightNumber: flight.number,
      scheduledDeparture: safeToDate(flight.departure?.scheduledTime?.utc),
    });

    if (existingFlight) {
        console.log(`LOG: [AeroDataBox Service] Flight ${flight.number} already exists in DB. Will update.`);
    }

    let departureWeather = null;
    let arrivalWeather = null;
    let isWeatherLocked = existingFlight?.isWeatherLocked || false;

    const departureAirportIata = flight.type === 'departure' ? airport.iata : flight.departure?.airport?.iata;
    const arrivalAirportIata = flight.type === 'arrival' ? airport.iata : flight.arrival?.airport?.iata;
    const departureAirportIcao = flight.type === 'departure' ? airport.icao : flight.departure?.airport?.icao;
    const arrivalAirportIcao = flight.type === 'arrival' ? airport.icao : flight.arrival?.airport?.icao;

    if (!isWeatherLocked) {
      console.log(`LOG: [AeroDataBox Service] Fetching weather for ${flight.number} (Weather not locked).`);
      if (isCancelled) {
        departureWeather = await getWeatherAtTime(departureAirportIcao, flight.departure?.scheduledTime?.utc);
        arrivalWeather = await getWeatherAtTime(arrivalAirportIcao, flight.arrival?.scheduledTime?.utc);
        isWeatherLocked = true;
        console.log(`LOG: [AeroDataBox Service] Weather for cancelled flight ${flight.number} is now locked.`);
      } else if (isDelayed) {
        departureWeather = await getLatestWeather(departureAirportIcao);
        arrivalWeather = await getLatestWeather(arrivalAirportIcao);
      }
    } else {
      console.log(`LOG: [AeroDataBox Service] Weather for ${flight.number} is locked. Using existing data.`);
      departureWeather = existingFlight.weatherInfo?.departure;
      arrivalWeather = existingFlight.weatherInfo?.arrival;
    }

    const icao24 = flight.aircraft?.modeS;
    const liveData = icao24 ? await getLiveTrackingData(icao24) : null;
    let cancellationContext = existingFlight?.cancellationContext;

    const actualDepartureUtc =
      flight.departure?.actualTime?.utc ||
      flight.departure?.revisedTime?.utc ||
      null;

    const normalizedData = {
      flightNumber: flight.number,
      departureAirport: departureAirportIata,
      arrivalAirport: arrivalAirportIata,
      scheduledDeparture: safeToDate(flight.departure?.scheduledTime?.utc),
      actualDeparture: safeToDate(actualDepartureUtc),
      status: isCancelled ? "Cancelled" : "Delayed",
      delayDuration: delayMinutes ?? 0,
      icao24,
      aircraftModel: flight.aircraft?.model,
      live: liveData,
      weatherInfo: { departure: departureWeather, arrival: arrivalWeather },
      isWeatherLocked,
      cancellationContext,
      analysisFlags: {},
    };

    normalizedData.analysisFlags = generateAnalysisFlags(normalizedData);

    if (!normalizedData.departureAirport || !normalizedData.arrivalAirport) {
      console.warn(`LOG: [AeroDataBox Service] Skipping flight ${flight.number} due to missing airport IATA code. Departure: ${normalizedData.departureAirport}, Arrival: ${normalizedData.arrivalAirport}`);
      continue;
    }
    
    console.log(`LOG: [AeroDataBox Service] [PROCESSED DATA TO DB] Upserting flight ${normalizedData.flightNumber}:`, JSON.stringify(normalizedData, null, 2));
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
  console.log(`LOG: [AeroDataBox Service] Processing complete for ${airport.icao}. Found ${relevantCount} relevant flights, processed ${processedCount}.`);
};

const fetchAndProcessFlights = async () => {
  console.log("LOG: [Cron] Starting master flight data processing job...");

  const airportsToMonitor = await MonitoredAirport.find({});
  
  if (airportsToMonitor.length === 0) {
    console.log("LOG: [AeroDataBox Service] No airports configured for monitoring. Skipping job.");
    return;
  }
  
  console.log(`LOG: [AeroDataBox Service] Found ${airportsToMonitor.length} airports to monitor.`);

  for (const airport of airportsToMonitor) {
    try {
      await processAirport(airport.toObject());
    } catch (error) {
      console.error(`An error occurred while processing airport ${airport.name}:`, error);
    }
  }
  console.log("\nLOG: [Cron] Master flight data processing job finished.");
};

module.exports = { fetchAndProcessFlights };