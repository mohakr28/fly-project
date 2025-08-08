// frontend/src/components/FlightDashboard.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useOutletContext } from "react-router-dom";
import { useDebounce } from "./useDebounce";
import DashboardStats from "./DashboardStats";
import FlightGrid from "./FlightGrid";
import { ControlPanel } from "./ControlPanel";
import Header from "./Header";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const FlightDashboard = () => {
  const { toggleSidebar, theme, toggleTheme } = useOutletContext();
  const [allFlights, setAllFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const fetchFlights = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const config = { headers: { "x-auth-token": token } };

    try {
      const response = await axios.get(`${API_URL}/api/flights`, config);
      const sorted = response.data.sort(
        (a, b) =>
          new Date(b.scheduledDeparture) - new Date(a.scheduledDeparture)
      );
      setAllFlights(sorted);
    } catch (error) {
      console.error("Error fetching flights:", error);
      if (error.response && error.response.status === 401) {
        window.location.href = "/login";
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlights();
  }, [fetchFlights]);

  const filteredFlights = useMemo(() => {
    return allFlights.filter((flight) => {
      const statusMatch =
        activeStatus === "all" || flight.status.toLowerCase() === activeStatus;
      const query = debouncedSearchQuery.toLowerCase();
      const searchMatch =
        query === "" ||
        flight.flightNumber.toLowerCase().includes(query) ||
        flight.departureAirport.toLowerCase().includes(query) ||
        flight.arrivalAirport.toLowerCase().includes(query);
      const dateMatch =
        filterDate === "" ||
        new Date(flight.scheduledDeparture).toISOString().slice(0, 10) ===
          filterDate;
      return statusMatch && searchMatch && dateMatch;
    });
  }, [allFlights, activeStatus, debouncedSearchQuery, filterDate]);

  return (
    // استخدام Flexbox و gap لتنسيق المسافات بين المكونات
    <div className="flex flex-col gap-6">
      <Header
        title="Flight Operations Monitor"
        toggleSidebar={toggleSidebar}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      <DashboardStats flights={allFlights} />
      <ControlPanel
        activeStatus={activeStatus}
        onStatusChange={setActiveStatus}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterDate={filterDate}
        onDateChange={setFilterDate}
      />
      <FlightGrid flights={filteredFlights} loading={loading} />
    </div>
  );
};

export default FlightDashboard;
