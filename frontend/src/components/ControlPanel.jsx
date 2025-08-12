// frontend/src/components/ControlPanel.jsx
import React from "react";

const StatusButton = ({ onClick, label, value, activeStatus }) => (
  <button
    onClick={() => onClick(value)}
    className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200
      ${
        activeStatus === value
          ? "bg-accent text-white"
          : "bg-secondary text-text-secondary hover:bg-tertiary hover:text-text-primary"
      }`}
  >
    {label}
  </button>
);

export const ControlPanel = ({ filters, onFilterChange, monitoredAirportOptions }) => {
  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    onFilterChange((prev) => ({ ...prev, [name]: value }));
  };
  
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <StatusButton
          onClick={(value) => onFilterChange((p) => ({ ...p, status: value }))}
          label="All Status"
          value="all"
          activeStatus={filters.status}
        />
        <StatusButton
          onClick={(value) => onFilterChange((p) => ({ ...p, status: value }))}
          label="Delayed"
          value="delayed"
          activeStatus={filters.status}
        />
        <StatusButton
          onClick={(value) => onFilterChange((p) => ({ ...p, status: value }))}
          label="Cancelled"
          value="cancelled"
          activeStatus={filters.status}
        />
      </div>

      <select
        name="monitoredAirport"
        value={filters.monitoredAirport}
        onChange={handleSelectChange}
        className="w-full md:w-auto px-3 py-2 bg-primary border border-border-color rounded-md text-text-secondary focus:ring-2 focus:ring-accent focus:outline-none"
      >
        <option value="all">All Monitored Airports</option>
        {monitoredAirportOptions.map((airport) => (
          <option key={airport.iata} value={airport.iata}>
            {airport.name} ({airport.iata})
          </option>
        ))}
      </select>
    </div>
  );
};