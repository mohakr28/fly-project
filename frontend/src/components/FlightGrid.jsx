// frontend/src/components/FlightGrid.jsx
import React from "react";
import { motion } from "framer-motion";
import FlightCardPro from "./FlightCardPro";
import { FaSearch } from "react-icons/fa";

// بطاقة هيكلية محسنة مع تأثير النبض
const SkeletonCard = () => (
  <div className="bg-secondary rounded-lg shadow-sm p-4 animate-pulse space-y-4">
    <div className="flex justify-between items-center">
      <div className="h-4 bg-tertiary rounded w-1/3"></div>
      <div className="h-6 bg-tertiary rounded-full w-1/4"></div>
    </div>
    <div className="h-10 bg-tertiary rounded w-full"></div>
    <div className="h-20 bg-primary rounded"></div>
  </div>
);

const NoResults = () => (
  <div className="col-span-full flex flex-col items-center justify-center text-center p-12 bg-secondary rounded-lg">
    <FaSearch className="text-4xl text-text-secondary mb-4" />
    <h2 className="text-xl font-bold text-text-primary">No Flights Found</h2>
    <p className="mt-1 text-text-secondary">
      Try adjusting your search or filter criteria.
    </p>
  </div>
);

const gridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const FlightGrid = ({ flights, loading }) => {
  const gridClasses = "grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6";

  if (loading) {
    return (
      <div className={gridClasses}>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (flights.length === 0) {
    return (
      <div className={gridClasses}>
        <NoResults />
      </div>
    );
  }

  return (
    <motion.div
      className={gridClasses}
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
