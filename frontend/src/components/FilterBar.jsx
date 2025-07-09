import React from "react";

const FilterBar = ({ filters, onFilterChange, onSearch }) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onFilterChange((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <form className="filter-bar" onSubmit={handleSubmit}>
      <input
        type="date"
        name="filterDate"
        value={filters.filterDate}
        onChange={handleInputChange}
      />
      <input
        type="text"
        name="filterFlightNumber"
        placeholder="Flight Number (e.g., SK1429)"
        value={filters.filterFlightNumber}
        onChange={handleInputChange}
      />
      <input
        type="text"
        name="filterDepartureAirport"
        placeholder="Departure Airport (e.g., CPH)"
        value={filters.filterDepartureAirport}
        onChange={handleInputChange}
      />
      <button type="submit">Search</button>
    </form>
  );
};

export default FilterBar;
