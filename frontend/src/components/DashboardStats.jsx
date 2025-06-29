// src/components/DashboardStats.js
import React from "react";
// Import icons for the stat cards
import { FaPlane, FaClock, FaTimesCircle } from "react-icons/fa";

// A reusable component for a single statistic card
const StatCard = ({ icon, label, value, className }) => (
  <div className={`stat-card ${className}`}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-info">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  </div>
);

/**
 * A component that displays key statistics about the flight data.
 * @param {object} props - Component props.
 * @param {Array} props.flights - The array of flight data.
 */
const DashboardStats = ({ flights }) => {
  // Calculate statistics based on the flight data
  const totalFlights = flights.length;
  const delayedCount = flights.filter((f) => f.status === "Delayed").length;
  const cancelledCount = flights.filter((f) => f.status === "Cancelled").length;

  return (
    <div className="stats-container">
      <StatCard
        icon={<FaPlane />}
        label="Total Flights Tracked"
        value={totalFlights}
        className="total"
      />
      <StatCard
        icon={<FaClock />}
        label="Delayed Flights"
        value={delayedCount}
        className="delayed"
      />
      <StatCard
        icon={<FaTimesCircle />}
        label="Cancelled Flights"
        value={cancelledCount}
        className="cancelled"
      />
    </div>
  );
};

export default DashboardStats;
