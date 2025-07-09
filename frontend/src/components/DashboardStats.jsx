import React from "react";
import { FaPlane, FaClock, FaTimesCircle } from "react-icons/fa";

const StatCard = ({ icon, value, label, type }) => (
  <div className={`stat-card ${type}`}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-info">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  </div>
);

const DashboardStats = ({ flights }) => {
  const delayedCount = flights.filter((f) => f.status === "Delayed").length;
  const cancelledCount = flights.filter((f) => f.status === "Cancelled").length;

  return (
    <div className="stats-container">
      <StatCard
        icon={<FaPlane />}
        value={flights.length}
        label="Total Flights Tracked"
        type="total"
      />
      <StatCard
        icon={<FaClock />}
        value={delayedCount}
        label="Delayed Flights"
        type="delayed"
      />
      <StatCard
        icon={<FaTimesCircle />}
        value={cancelledCount}
        label="Cancelled Flights"
        type="cancelled"
      />
    </div>
  );
};

export default DashboardStats;
