// frontend/src/components/FlightDashboard.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useOutletContext, Link } from "react-router-dom";
import { useDebounce } from "./useDebounce";
import { motion, AnimatePresence } from "framer-motion";
import DashboardStats from "./DashboardStats";
import FlightGrid from "./FlightGrid";
import { ControlPanel } from "./ControlPanel";
import Header from "./Header";
import airlines from "../data/airlines.json";
import { FaPlusCircle, FaFilter, FaSearch, FaTimes } from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const NoAirportsMessage = () => (
    <div className="text-center p-10 bg-secondary rounded-lg border-2 border-dashed border-border-color">
        <h3 className="text-xl font-bold text-text-primary">No Airports Monitored</h3>
        <p className="mt-2 text-text-secondary">
            You need to add at least one airport to start tracking flights.
        </p>
        <Link to="/airports">
            <button className="mt-4 px-4 py-2 bg-accent text-white font-semibold rounded-md hover:bg-opacity-90 transition flex items-center gap-2 mx-auto">
                <FaPlusCircle /> Add an Airport
            </button>
        </Link>
    </div>
);

const AdvancedFilters = ({ filters, onFilterChange, airlineOptions }) => {
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        onFilterChange((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-secondary rounded-lg shadow-sm">
                <select
                    name="airline"
                    value={filters.airline}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-primary border border-border-color rounded-md text-text-secondary focus:ring-2 focus:ring-accent focus:outline-none"
                >
                    <option value="">All Airlines</option>
                    {airlineOptions.map((code) => (
                        <option key={code} value={code}>{airlines[code]} ({code})</option>
                    ))}
                </select>

                <input
                    type="number"
                    name="minDelay"
                    placeholder="Minimum Delay (minutes)"
                    value={filters.minDelay}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-2 bg-primary border border-border-color rounded-md focus:ring-2 focus:ring-accent focus:outline-none"
                />

                <input
                    type="date"
                    name="date"
                    value={filters.date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-primary border border-border-color rounded-md text-text-secondary focus:ring-2 focus:ring-accent focus:outline-none dark:[color-scheme:dark]"
                />
            </div>
        </motion.div>
    );
};

const SearchBar = ({ query, onChange }) => (
    <div className="relative flex-grow">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
            type="search"
            name="searchQuery"
            placeholder="Search by flight number..."
            value={query}
            onChange={(e) => onChange(e.target.value)}
            className="w-full pl-10 pr-10 py-2 bg-secondary border border-border-color rounded-lg focus:ring-2 focus:ring-accent focus:outline-none"
        />
        {query && (
            <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                onClick={() => onChange("")}
            >
                <FaTimes />
            </button>
        )}
    </div>
);

const FlightDashboard = () => {
  const { toggleSidebar, theme, toggleTheme } = useOutletContext();
  const [allFlights, setAllFlights] = useState([]);
  const [monitoredAirports, setMonitoredAirports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [filters, setFilters] = useState({
    status: "all",
    searchQuery: "",
    date: "",
    airline: "",
    minDelay: "",
    monitoredAirport: "all",
  });

  const debouncedSearchQuery = useDebounce(filters.searchQuery, 300);
  const debouncedMinDelay = useDebounce(filters.minDelay, 300);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const config = { headers: { "x-auth-token": token } };

    try {
      const [flightsRes, airportsRes] = await Promise.all([
        axios.get(`${API_URL}/api/flights`, config),
        axios.get(`${API_URL}/api/airports`, config),
      ]);
      
      const sorted = flightsRes.data.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setAllFlights(sorted);
      setMonitoredAirports(airportsRes.data);

    } catch (error) {
      console.error("Error fetching data:", error);
      if (error.response && error.response.status === 401) {
        window.location.href = "/login";
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const airlineOptions = useMemo(() => {
    const airlineCodes = new Set(
      allFlights.map((f) => f.flightNumber.substring(0, 2))
    );
    return Array.from(airlineCodes).filter(code => airlines[code]);
  }, [allFlights]);

  const filteredFlights = useMemo(() => {
    if (monitoredAirports.length === 0) return [];
    
    return allFlights.filter((flight) => {
      const statusMatch = filters.status === "all" || flight.status.toLowerCase() === filters.status;
      const query = debouncedSearchQuery.toLowerCase();
      const searchMatch = query === "" || flight.flightNumber.toLowerCase().includes(query);
      const dateMatch = filters.date === "" || new Date(flight.scheduledDeparture).toISOString().slice(0, 10) === filters.date;
      const airlineMatch = filters.airline === "" || flight.flightNumber.startsWith(filters.airline);
      const minDelayMatch = !debouncedMinDelay || (flight.status === "Delayed" && flight.delayDuration >= parseInt(debouncedMinDelay, 10));
      
      const monitoredAirportMatch = filters.monitoredAirport === 'all' || 
        flight.departureAirport === filters.monitoredAirport || 
        flight.arrivalAirport === filters.monitoredAirport;

      return statusMatch && searchMatch && dateMatch && airlineMatch && minDelayMatch && monitoredAirportMatch;
    });
  }, [allFlights, filters, debouncedSearchQuery, debouncedMinDelay, monitoredAirports]);

  return (
    <div className="flex flex-col gap-6">
      <Header
        title="Flight Operations Monitor"
        toggleSidebar={toggleSidebar}
        theme={theme}
        toggleTheme={toggleTheme}
        actions={
            <SearchBar 
                query={filters.searchQuery} 
                onChange={(value) => setFilters(prev => ({...prev, searchQuery: value}))}
            />
        }
      />
      {loading ? <p>Loading dashboard...</p> : (
        monitoredAirports.length === 0 ? <NoAirportsMessage /> : (
          <>
            <DashboardStats flights={filteredFlights} />
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-secondary rounded-lg shadow-sm p-4">
              <ControlPanel
                  filters={filters}
                  onFilterChange={setFilters}
                  monitoredAirportOptions={monitoredAirports}
              />
              <button onClick={() => setShowAdvancedFilters(prev => !prev)} className={`flex-shrink-0 w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${showAdvancedFilters ? 'bg-accent text-white' : 'bg-primary text-text-secondary'}`}>
                  <FaFilter />
                  <span>Advanced</span>
              </button>
            </div>
            
            <AnimatePresence>
                {showAdvancedFilters && (
                    <AdvancedFilters filters={filters} onFilterChange={setFilters} airlineOptions={airlineOptions} />
                )}
            </AnimatePresence>

            <FlightGrid flights={filteredFlights} loading={loading} monitoredAirports={monitoredAirports} />
          </>
        )
      )}
    </div>
  );
};

export default FlightDashboard;