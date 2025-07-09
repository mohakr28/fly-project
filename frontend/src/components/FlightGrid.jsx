import React from "react";
import { motion } from "framer-motion";
import FlightCardPro from "./FlightCardPro"; // سنستخدم البطاقة الجديدة
import { FaSearch } from "react-icons/fa";

// تصميم هيكلي أفضل
const SkeletonCard = () => (
  <div className="flight-card-pro" style={{ padding: "20px" }}>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "24px",
      }}
    >
      <div
        style={{
          height: "24px",
          width: "40%",
          background: "#e2e8f0",
          borderRadius: "4px",
        }}
      ></div>
      <div
        style={{
          height: "24px",
          width: "25%",
          background: "#e2e8f0",
          borderRadius: "4px",
        }}
      ></div>
    </div>
    <div
      style={{
        height: "40px",
        background: "#e2e8f0",
        borderRadius: "4px",
        marginBottom: "16px",
      }}
    ></div>
    <div
      style={{ height: "20px", background: "#e2e8f0", borderRadius: "4px" }}
    ></div>
  </div>
);

const NoResults = ({ flightCount }) => (
  <div className="no-results-pro">
    <FaSearch />
    <h2>No Flights to Display</h2>
    <p>
      {flightCount > 0
        ? "No flights match your current filter. Try selecting another category."
        : "There are currently no delayed or cancelled flights being tracked."}
    </p>
  </div>
);

const gridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const FlightGrid = ({ flights, loading }) => {
  if (loading) {
    return (
      <div className="flight-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (flights.length === 0) {
    return <NoResults flightCount={flights.length} />;
  }

  return (
    <motion.div
      className="flight-grid"
      variants={gridVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      {flights.map((flight) => (
        <FlightCardPro key={flight._id} flight={flight} />
      ))}
    </motion.div>
  );
};

export default FlightGrid;
