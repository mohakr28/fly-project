// frontend/src/components/DashboardStats.jsx
import React from "react";
import { FaPlane, FaClock, FaTimesCircle } from "react-icons/fa";

const StatCard = ({ icon, value, label, colorClass }) => (
  <div className="flex items-center p-4 bg-secondary rounded-lg shadow-sm">
    <div className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${colorClass}`}>
      {icon}
    </div>
    <div className="ml-4">
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-sm font-medium text-text-secondary">{label}</p>
    </div>
  </div>
);

// ✅ تم تعديل Props ليقبل الأرقام مباشرة
const DashboardStats = ({ total, delayed, cancelled }) => {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <StatCard
        icon={<FaPlane className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />}
        value={total}
        label="Total Flights Tracked"
        colorClass="bg-indigo-100 dark:bg-indigo-500/20"
      />
      <StatCard
        icon={<FaClock className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />}
        value={delayed}
        label="Delayed Flights"
        colorClass="bg-yellow-100 dark:bg-yellow-500/20"
      />
      <StatCard
        icon={<FaTimesCircle className="h-6 w-6 text-red-600 dark:text-red-300" />}
        value={cancelled}
        label="Cancelled Flights"
        colorClass="bg-red-100 dark:bg-red-500/20"
      />
    </div>
  );
};

export default DashboardStats;