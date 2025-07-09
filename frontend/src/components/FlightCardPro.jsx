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
} from "react-icons/fa";

import airlines from "../data/airlines.json";
import airports from "../data/airports.json";

const WeatherDetail = ({ icon, value, unit, highlightClass = "" }) => {
  if (value === null || value === undefined) return null;
  return (
    <div className={`weather-detail ${highlightClass}`}>
      {icon}
      <span>
        {value}
        {unit}
      </span>
    </div>
  );
};

const WeatherBlock = ({ weather, type }) => {
  if (!weather) {
    return (
      <div className="weather-block">
        <h4>{type} Weather</h4>
        <div className="weather-details-grid">
          <span className="weather-detail">No data available.</span>
        </div>
      </div>
    );
  }

  const visibilityKm =
    weather.visibility !== null && weather.visibility !== undefined
      ? (weather.visibility / 1000).toFixed(1)
      : null;
  const visibilityHighlight =
    visibilityKm !== null && visibilityKm < 1.5 ? "highlight-bad" : "";
  return (
    <div className="weather-block">
      <h4>{type} Weather</h4>
      <div className="weather-details-grid">
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

const getFormattedLocalTime = (dateString, airportInfo) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (!isValid(date)) return "N/A";

  const timezone = airportInfo?.timezone || "UTC";
  try {
    const localTime = toZonedTime(date, timezone);
    return formatInTz(localTime, timezone, "HH:mm zzz");
  } catch (e) {
    return format(date, "HH:mm 'UTC'");
  }
};

const getAnalysisAge = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (!isValid(date)) return "N/A";
  return formatDistanceToNowStrict(date, { addSuffix: true });
};

const FlightCardPro = ({ flight }) => {
  const airlineCode = flight.flightNumber.substring(0, 2);
  const airlineName = airlines[airlineCode] || airlineCode;
  const departureAirportInfo = airports[flight.departureAirport];
  const arrivalAirportInfo = airports[flight.arrivalAirport];

  const formattedLocalTime = getFormattedLocalTime(
    flight.scheduledDeparture,
    departureAirportInfo
  );
  const analysisAge = getAnalysisAge(flight.createdAt);

  const { isWeatherSevere } = flight.analysisFlags || {};

  const scheduledDepDate = new Date(flight.scheduledDeparture);
  const createdAtDate = new Date(flight.createdAt);
  const isReportingDelayed =
    flight.status === "Cancelled" &&
    isValid(scheduledDepDate) &&
    isValid(createdAtDate) &&
    createdAtDate > scheduledDepDate;

  return (
    <motion.div layout className={`flight-card ${flight.status}`}>
      <div className="card-header">
        <div className="flight-identity">
          <span>{`${airlineName} (${flight.flightNumber})`}</span>
        </div>
        <div className={`flight-status-badge ${flight.status.toLowerCase()}`}>
          {flight.status}
        </div>
      </div>

      <div className="card-content">
        <div className="flight-path-grid">
          <div className="airport">
            <div className="airport-main">{flight.departureAirport}</div>
            <div className="airport-name">
              {departureAirportInfo?.name || "Unknown Airport"}
            </div>
            <div className="local-time">{formattedLocalTime}</div>
          </div>
          <div className="flight-path-center">
            <FaPlane />
          </div>
          <div className="airport">
            <div className="airport-main">{flight.arrivalAirport}</div>
            <div className="airport-name">
              {arrivalAirportInfo?.name || "Unknown Airport"}
            </div>
          </div>
        </div>
      </div>

      <div className="analysis-section">
        <h3 className="analysis-title">Analysis & Evidence</h3>

        {(isWeatherSevere || isReportingDelayed) && (
          <div className="analysis-flags-container">
            {isWeatherSevere && (
              <div className="flag-item severe-weather">
                <FaExclamationTriangle />
                <span>Severe Weather</span>
              </div>
            )}
            {isReportingDelayed && (
              <div className="flag-item late-report">
                <FaInfoCircle />
                <span>Late Cancellation</span>
              </div>
            )}
          </div>
        )}

        <div className="evidence-section">
          <h4 className="evidence-title">Weather Conditions</h4>
          <div className="evidence-content">
            <div className="weather-grid">
              <WeatherBlock
                weather={flight.weatherInfo?.departure}
                type="Departure"
              />
              <WeatherBlock
                weather={flight.weatherInfo?.arrival}
                type="Arrival"
              />
            </div>
          </div>
        </div>

        {flight.cancellationContext && (
          <div className="evidence-section">
            <h4 className="evidence-title">Operational Context</h4>
            <div className="evidence-content">
              <p>{flight.cancellationContext}</p>
            </div>
          </div>
        )}
      </div>

      <div className="card-footer">
        <span>
          <FaFighterJet /> {flight.aircraftModel || "N/A"}
        </span>
        <span>
          <FaSyncAlt /> Analyzed: {analysisAge}
        </span>
      </div>
    </motion.div>
  );
};

export default FlightCardPro;
