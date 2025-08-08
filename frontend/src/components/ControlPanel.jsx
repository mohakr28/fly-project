// frontend/src/components/ControlPanel.jsx
import React from "react";
import { FaSearch, FaTimes } from "react-icons/fa";

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

export const ControlPanel = ({
  onStatusChange,
  onSearchChange,
  onDateChange,
  activeStatus,
  searchQuery,
  filterDate,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-secondary rounded-lg shadow-sm">
      {/* Status Filters */}
      <div className="flex items-center gap-2">
        <StatusButton
          onClick={onStatusChange}
          label="All"
          value="all"
          activeStatus={activeStatus}
        />
        <StatusButton
          onClick={onStatusChange}
          label="Delayed"
          value="delayed"
          activeStatus={activeStatus}
        />
        <StatusButton
          onClick={onStatusChange}
          label="Cancelled"
          value="cancelled"
          activeStatus={activeStatus}
        />
      </div>

      {/* Search and Date Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
        <div className="relative w-full sm:w-64">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="search"
            placeholder="Search flight or airport..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-primary border border-border-color rounded-md focus:ring-2 focus:ring-accent focus:outline-none"
          />
          {searchQuery && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
              onClick={() => onSearchChange("")}
            >
              <FaTimes />
            </button>
          )}
        </div>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 bg-primary border border-border-color rounded-md text-text-secondary focus:ring-2 focus:ring-accent focus:outline-none dark:[color-scheme:dark]"
        />
      </div>
    </div>
  );
};
