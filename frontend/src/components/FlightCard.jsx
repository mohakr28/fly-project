import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  FaPlane,
  FaInfoCircle,
  FaClock,
  FaCalendarDay,
  FaChevronDown,
  FaFighterJet,
} from "react-icons/fa";
import WeatherInfo from "./WeatherInfo";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const detailsVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: { opacity: 1, height: "auto", transition: { duration: 0.3 } },
  exit: { opacity: 0, height: 0, transition: { duration: 0.2 } },
};

const FlightCard = ({ flight }) => {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const scheduledDepTime = flight.scheduledDeparture
    ? format(new Date(flight.scheduledDeparture), "HH:mm")
    : "--:--";
  const actualDepTime = flight.actualDeparture
    ? format(new Date(flight.actualDeparture), "HH:mm")
    : null;
  const flightDate = flight.scheduledDeparture
    ? format(new Date(flight.scheduledDeparture), "dd MMM yyyy")
    : "N/A";

  // ✅ استخراج أسماء المطارات بأمان
  const departureAirportName =
    flight.departure?.airport?.name || "Unknown Airport";
  const arrivalAirportName = flight.arrival?.airport?.name || "Unknown Airport";

  return (
    <motion.div
      layout
      className={`flight-card ${flight.status}`}
      variants={cardVariants}
    >
      <div className="card-header">
        <div className="flight-identity">
          {flight.flightNumber.toUpperCase()}
        </div>
        <div className="flight-date">{flightDate}</div>
      </div>

      <div className="card-body">
        <div className="flight-path">
          <div className="airport-details">
            <div className="airport-code">{flight.departureAirport}</div>
            {/* ✅ إضافة اسم المطار هنا */}
            <div className="airport-name">{departureAirportName}</div>
          </div>
          <div className="path-line"></div>
          <div className="airport-details">
            <div className="airport-code">{flight.arrivalAirport}</div>
            {/* ✅ إضافة اسم المطار هنا */}
            <div className="airport-name">{arrivalAirportName}</div>
          </div>
        </div>
        <div className="time-info">
          <span>Scheduled: {scheduledDepTime}</span>
          {actualDepTime && (
            <span className="time-actual">Actual: {actualDepTime}</span>
          )}
        </div>
      </div>

      <div className="card-footer">
        <button
          className="details-toggle"
          onClick={() => setDetailsOpen(!detailsOpen)}
        >
          <span>Details</span>
          <motion.div animate={{ rotate: detailsOpen ? 180 : 0 }}>
            <FaChevronDown />
          </motion.div>
        </button>
        <AnimatePresence>
          {detailsOpen && (
            <motion.div
              className="details-content"
              variants={detailsVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <WeatherInfo
                weather={flight.weatherInfo?.departure}
                type="Departure"
              />
              <WeatherInfo
                weather={flight.weatherInfo?.arrival}
                type="Arrival"
              />
              {flight.cancellationContext && (
                <div className="detail-item">
                  <FaInfoCircle /> <strong>Reason:</strong>{" "}
                  {flight.cancellationContext}
                </div>
              )}
              {flight.delayDuration > 0 && (
                <div className="detail-item">
                  <FaClock /> <strong>Delay:</strong> {flight.delayDuration}{" "}
                  minutes
                </div>
              )}
              {flight.aircraft?.model && (
                <div className="detail-item">
                  <FaFighterJet /> <strong>Aircraft:</strong>{" "}
                  {flight.aircraft.model}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default FlightCard;
