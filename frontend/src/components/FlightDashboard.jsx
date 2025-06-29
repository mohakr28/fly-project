// src/components/FlightDashboard.js
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import FlightCard from "./FlightCard";
import DashboardStats from "./DashboardStats";

// استخدام متغير البيئة لرابط الواجهة الخلفية
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const FlightDashboard = () => {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState("");
  const [filterFlightNumber, setFilterFlightNumber] = useState("");
  const [filterDepartureAirport, setFilterDepartureAirport] = useState("");

  const fetchFlights = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterDate) params.append("flightDate", filterDate);
      if (filterFlightNumber) params.append("flightNumber", filterFlightNumber);
      if (filterDepartureAirport)
        params.append("departureAirport", filterDepartureAirport);

      // استخدام API_URL المجهز للنشر
      const response = await axios.get(
        `${API_URL}/api/flights?${params.toString()}`
      );
      setFlights(response.data);
    } catch (error) {
      console.error("Error fetching flights:", error);
    } finally {
      setLoading(false);
    }
  }, [filterDate, filterFlightNumber, filterDepartureAirport]);

  useEffect(() => {
    fetchFlights();
  }, [fetchFlights]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchFlights();
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Flight Status Dashboard</h1>
      </header>
      <DashboardStats flights={flights} />
      <div className="filter-container">
        <form onSubmit={handleSearch} className="filter-form">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
          <input
            type="text"
            placeholder="Flight Number"
            value={filterFlightNumber}
            onChange={(e) => setFilterFlightNumber(e.target.value)}
          />
          <input
            type="text"
            placeholder="Departure Airport"
            value={filterDepartureAirport}
            onChange={(e) => setFilterDepartureAirport(e.target.value)}
          />
          <button type="submit">Search Flights</button>
        </form>
      </div>
      <main className="results-container">
        {loading ? (
          <div className="loading-spinner"></div>
        ) : (
          <div className="flights-grid">
            {flights.length > 0 ? (
              flights.map((flight) => (
                <FlightCard key={flight._id} flight={flight} />
              ))
            ) : (
              <div className="no-results">
                <h2>No Relevant Flights Found</h2>
                <p>
                  Adjust your filters or wait for the system to detect new
                  delayed/cancelled flights.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default FlightDashboard;
