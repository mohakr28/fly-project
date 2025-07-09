import React from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { FaPlane, FaInfoCircle, FaClock, FaFighterJet } from "react-icons/fa";
import WeatherInfo from "./WeatherInfo";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const FlightCardPro = ({ flight }) => {
  const scheduledDepTime = flight.scheduledDeparture
    ? format(new Date(flight.scheduledDeparture), "HH:mm")
    : "--:--";
  const actualDepTime = flight.actualDeparture
    ? format(new Date(flight.actualDeparture), "HH:mm")
    : null;
  const flightDate = flight.scheduledDeparture
    ? format(new Date(flight.scheduledDeparture), "dd MMM") // تاريخ مختصر
    : "N/A";

  return (
    <motion.div
      layout
      className={`flight-card ${flight.status}`}
      variants={cardVariants}
    >
      <div className="card-header">
        <div className="flight-identity">
          <span>{flight.flightNumber.toUpperCase()}</span>
          <span className="flight-date">{flightDate}</span>
        </div>
        <div className={`flight-status-badge ${flight.status.toLowerCase()}`}>
          {flight.status}
        </div>
      </div>

      <div className="card-content">
        <div className="flight-path">
          <div className="airport-details">
            <div className="airport-code">{flight.departureAirport}</div>
          </div>
          <FaPlane className="path-icon" />
          <div className="airport-details">
            <div className="airport-code">{flight.arrivalAirport}</div>
          </div>
        </div>
        <div className="time-info">
          <span>Scheduled: {scheduledDepTime}</span>
          {actualDepTime && (
            <span className="time-actual">Actual: {actualDepTime}</span>
          )}
        </div>

        <hr className="divider" />

        <div className="details-grid">
          <WeatherInfo
            weather={flight.weatherInfo?.departure}
            type="Departure"
          />
          <WeatherInfo weather={flight.weatherInfo?.arrival} type="Arrival" />
          {flight.cancellationContext && (
            <div className="detail-item">
              <FaInfoCircle /> <strong>Reason:</strong>{" "}
              {flight.cancellationContext}
            </div>
          )}
          {flight.delayDuration > 0 && (
            <div className="detail-item">
              <FaClock /> <strong>Delay:</strong> {flight.delayDuration} mins
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default FlightCardPro;
