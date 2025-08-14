// frontend/src/components/FlightCardPro.jsx
import React from "react";
import { motion } from "framer-motion";
import { format, formatDistanceToNowStrict, isValid } from "date-fns";
import { toZonedTime, format as formatInTz } from "date-fns-tz";
import {
  FaPlane,
  FaFighterJet,
  FaSyncAlt,
  FaTemperatureHigh,
  FaWind,
  FaEye,
  FaCloud,
  FaExclamationTriangle,
  FaInfoCircle,
  FaBroadcastTower,
} from "react-icons/fa";
// ✅ 1. تم حذف استيراد ملف airlines.json
import { useAirports } from "../context/AirportContext";

const getFormattedLocalTime = (dateString, airportInfo) => {
  if (!dateString || !isValid(new Date(dateString)) || !airportInfo?.timezone) {
    return "--:--";
  }
  try {
    const zonedTime = toZonedTime(dateString, airportInfo.timezone);
    return formatInTz(zonedTime, airportInfo.timezone, "HH:mm (z)");
  } catch (error) {
    return "--:--";
  }
};

const getAnalysisAge = (dateString) => {
  if (!dateString || !isValid(new Date(dateString))) return "N/A";
  return formatDistanceToNowStrict(new Date(dateString), { addSuffix: true });
};

const WeatherDetail = ({ icon, value, unit, highlightClass = "" }) => {
  if (value === null || value === undefined) return null;
  return (
    <div
      className={`flex items-center gap-2 text-sm text-text-secondary ${highlightClass}`}
    >
      {icon}
      <span>
        {value}
        {unit}
      </span>
    </div>
  );
};

const WeatherBlock = ({ weather, type }) => {
  if (!weather) return null;
  const visibilityKm =
    weather.visibility !== null && weather.visibility !== undefined
      ? (weather.visibility / 1000).toFixed(1)
      : null;
  const visibilityHighlight =
    visibilityKm !== null && visibilityKm < 1.5
      ? "text-red-500 dark:text-red-400 font-semibold"
      : "";

  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold text-text-primary border-b border-border-color pb-1">
        {type} Weather
      </h4>
      <div className="space-y-1">
        <WeatherDetail
          icon={<FaTemperatureHigh />}
          value={weather.temperature}
          unit="°C"
        />
        <WeatherDetail
          icon={<FaWind />}
          value={weather.windSpeed}
          unit=" km/h"
        />
        <WeatherDetail
          icon={<FaEye />}
          value={visibilityKm}
          unit=" km"
          highlightClass={visibilityHighlight}
        />
        {weather.cloudLayers?.[0] && (
          <WeatherDetail
            icon={<FaCloud />}
            value={`${weather.cloudLayers[0].cover} @ ${weather.cloudLayers[0].height}`}
            unit=" ft"
          />
        )}
      </div>
    </div>
  );
};

const AirportDisplay = ({ code, airportInfo, isMonitored }) => (
  <div>
    <p className="text-3xl font-bold text-text-primary flex items-center justify-center gap-2">
      {code} {isMonitored && <FaBroadcastTower className="text-accent text-lg" title="Monitored Airport" />}
    </p>
    <p className="text-xs text-text-secondary mt-1 truncate">
      {airportInfo?.name || "Loading..."}
    </p>
  </div>
);

const FlightCardPro = ({ flight, monitoredIataSet }) => {
  const { airports } = useAirports();
  
  const departureAirportInfo = airports[flight.departureAirport];
  const arrivalAirportInfo = airports[flight.arrivalAirport];

  const formattedLocalTime = getFormattedLocalTime(
    flight.scheduledDeparture,
    departureAirportInfo
  );
  const analysisAge = getAnalysisAge(flight.createdAt);

  const { isWeatherSevere } = flight.analysisFlags || {};
  const isReportingDelayed =
    flight.status === "Cancelled" &&
    isValid(new Date(flight.scheduledDeparture)) &&
    isValid(new Date(flight.createdAt)) &&
    new Date(flight.createdAt) > new Date(flight.scheduledDeparture);

  const statusClasses = {
    Delayed: {
      border: "border-l-yellow-500",
      badgeBg: "bg-yellow-100 dark:bg-yellow-500/20",
      badgeText: "text-yellow-800 dark:text-yellow-300",
    },
    Cancelled: {
      border: "border-l-red-600",
      badgeBg: "bg-red-100 dark:bg-red-500/20",
      badgeText: "text-red-800 dark:text-red-300",
    },
  };
  const currentStatus = statusClasses[flight.status] || {};

  return (
    <motion.div
      layout
      className={`bg-secondary rounded-lg shadow-sm border-l-4 ${currentStatus.border} transition-shadow hover:shadow-lg flex flex-col`}
    >
      {/* Card Header */}
      <div className="flex justify-between items-center p-4 border-b border-border-color">
        {/* ✅ 2. تم تبسيط هذا السطر لعرض رقم الرحلة فقط */}
        <span className="font-bold text-text-primary">
          {flight.flightNumber}
        </span>
        <span
          className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${currentStatus.badgeBg} ${currentStatus.badgeText}`}
        >
          {flight.status}
        </span>
      </div>

      {/* Flight Path */}
      <div className="p-4 grid grid-cols-[1fr,auto,1fr] items-start gap-4 text-center">
        <AirportDisplay
          code={flight.departureAirport}
          airportInfo={departureAirportInfo}
          isMonitored={monitoredIataSet.has(flight.departureAirport)}
        />
        <div className="mt-1 text-text-secondary">
          <FaPlane size={24} />
        </div>
        <AirportDisplay
          code={flight.arrivalAirport}
          airportInfo={arrivalAirportInfo}
          isMonitored={monitoredIataSet.has(flight.arrivalAirport)}
        />
      </div>

       {/* Departure Time Info - Moved here for better context */}
       <div className="text-center pb-4">
          <p className="text-xs font-semibold text-accent bg-accent-light rounded-full inline-block px-2 py-0.5">
            Scheduled Departure: {formattedLocalTime}
          </p>
      </div>


      {/* Analysis Section */}
      <div className="p-4 bg-primary border-t border-border-color">
        <h3 className="text-xs font-bold uppercase text-text-secondary tracking-wider mb-3">
          Analysis & Evidence
        </h3>
        {(isWeatherSevere || isReportingDelayed) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {isWeatherSevere && (
              <div className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300">
                <FaExclamationTriangle /> Severe Weather
              </div>
            )}
            {isReportingDelayed && (
              <div className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300">
                <FaInfoCircle /> Late Cancellation
              </div>
            )}
          </div>
        )}
        <div className="bg-secondary p-3 rounded-md border border-border-color grid grid-cols-1 sm:grid-cols-2 gap-4">
          <WeatherBlock
            weather={flight.weatherInfo?.departure}
            type="Departure"
          />
          <WeatherBlock weather={flight.weatherInfo?.arrival} type="Arrival" />
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center p-3 bg-primary text-xs text-text-secondary border-t border-border-color mt-auto">
        <span className="flex items-center gap-2">
          <FaFighterJet /> {flight.aircraftModel || "N/A"}
        </span>
        <span className="flex items-center gap-2">
          <FaSyncAlt /> Analyzed: {analysisAge}
        </span>
      </div>
    </motion.div>
  );
};

export default FlightCardPro;