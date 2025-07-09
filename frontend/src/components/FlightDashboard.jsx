// frontend/src/components/FlightDashboard.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useDebounce } from "./useDebounce";
import DashboardStats from "./DashboardStats";
import FlightGrid from "./FlightGrid";
import { ControlPanel } from "./ControlPanel";
import { ThemeToggle } from "./ThemeToggle";
// --- ✅ استيراد المكون الجديد ---
import EventReviewDashboard from "./EventReviewDashboard";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const FlightDashboard = () => {
  // Theme State
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light"
  );

  // --- ✅ إضافة حالة للتبويب النشط ---
  const [activeTab, setActiveTab] = useState("flights");

  // Data & Filter State
  const [allFlights, setAllFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Theme Toggling Logic
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  // Data Fetching Logic
  const fetchFlights = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/flights`);
      const sorted = response.data.sort(
        (a, b) =>
          new Date(b.scheduledDeparture) - new Date(a.scheduledDeparture)
      );
      setAllFlights(sorted);
    } catch (error) {
      console.error("Error fetching flights:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "flights") {
      fetchFlights();
    }
  }, [fetchFlights, activeTab]);

  // Client-Side Filtering Logic
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
    <div className="dashboard-container">
      <header className="main-header">
        <h1>Flight Operations Monitor</h1>
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      </header>

      {/* --- ✅ إضافة واجهة التبويبات --- */}
      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === "flights" ? "active" : ""}`}
          onClick={() => setActiveTab("flights")}
        >
          Flight Monitor
        </button>
        <button
          className={`tab-btn ${activeTab === "events" ? "active" : ""}`}
          onClick={() => setActiveTab("events")}
        >
          Event Review
        </button>
      </div>

      {/* --- ✅ عرض المحتوى بناءً على التبويب النشط --- */}
      {activeTab === "flights" && (
        <>
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
        </>
      )}

      {activeTab === "events" && <EventReviewDashboard />}
    </div>
  );
};

export default FlightDashboard;
