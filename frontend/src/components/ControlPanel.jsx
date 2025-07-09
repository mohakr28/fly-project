import React from "react";
import { FaSearch, FaTimes } from "react-icons/fa";

export const ControlPanel = ({
  onStatusChange,
  onSearchChange,
  onDateChange,
  activeStatus,
  searchQuery,
  filterDate,
}) => {
  return (
    <div className="control-panel">
      <div className="status-filter-group">
        <button
          onClick={() => onStatusChange("all")}
          className={activeStatus === "all" ? "active" : ""}
        >
          All
        </button>
        <button
          onClick={() => onStatusChange("delayed")}
          className={activeStatus === "delayed" ? "active" : ""}
        >
          Delayed
        </button>
        <button
          onClick={() => onStatusChange("cancelled")}
          className={activeStatus === "cancelled" ? "active" : ""}
        >
          Cancelled
        </button>
      </div>
      <div className="search-and-date-controls">
        <div className="input-wrapper">
          <FaSearch />
          <input
            type="search"
            placeholder="Search by flight or airport..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-btn" onClick={() => onSearchChange("")}>
              <FaTimes />
            </button>
          )}
        </div>
        <input
          type="date"
          className="date-filter"
          value={filterDate}
          onChange={(e) => onDateChange(e.target.value)}
        />
      </div>
    </div>
  );
};
