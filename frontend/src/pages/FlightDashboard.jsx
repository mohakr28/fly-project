// frontend/src/pages/FlightDashboard.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import { useOutletContext, Link } from "react-router-dom";
import { useDebounce } from "../components/useDebounce";
import { motion, AnimatePresence } from "framer-motion";
import DashboardStats from "../components/DashboardStats";
import FlightGrid from "../components/FlightGrid";
import { ControlPanel } from "../components/ControlPanel";
import Header from "../components/Header";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import SearchableSelect from "../components/SearchableSelect";
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

const AdvancedFilters = ({ filters, onFilterChange, airlineOptions, onAirlineChange, selectedAirlineValue }) => {
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        onFilterChange((prev) => ({ ...prev, [name]: value }));
    };
    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }} className="overflow-hidden" >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-secondary rounded-lg shadow-sm">
                <SearchableSelect
                    options={airlineOptions}
                    value={selectedAirlineValue}
                    onChange={onAirlineChange}
                    placeholder="Filter by airline..."
                />
                <input type="number" name="minDelay" placeholder="Minimum Delay (minutes)" value={filters.minDelay}
                    onChange={handleInputChange} min="0"
                    className="w-full px-4 py-2 bg-primary border border-border-color rounded-md focus:ring-2 focus:ring-accent focus:outline-none" />
                <input type="date" name="date" value={filters.date} onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-primary border border-border-color rounded-md text-text-secondary focus:ring-2 focus:ring-accent focus:outline-none dark:[color-scheme:dark]" />
            </div>
        </motion.div>
    );
};

const SearchBar = ({ query, onChange }) => (
    <div className="relative flex-grow">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input type="search" name="searchQuery" placeholder="Search by flight number..." value={query}
            onChange={(e) => onChange(e.target.value)}
            className="w-full pl-10 pr-10 py-2 bg-secondary border border-border-color rounded-lg focus:ring-2 focus:ring-accent focus:outline-none" />
        {query && ( <button className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                onClick={() => onChange("")} > <FaTimes /> </button>
        )}
    </div>
);

const FlightDashboard = () => {
  const { toggleSidebar, theme, toggleTheme } = useOutletContext();
  const [flights, setFlights] = useState([]);
  const [monitoredAirports, setMonitoredAirports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalFlights: 0 });
  const [filters, setFilters] = useState({
    status: "all", searchQuery: "", date: "",
    airline: "", minDelay: "", monitoredAirport: "all",
  });
  const [airlineOptions, setAirlineOptions] = useState([]);

  const debouncedSearchQuery = useDebounce(filters.searchQuery, 400);
  const debouncedMinDelay = useDebounce(filters.minDelay, 400);

  const loaderRef = useRef(null);

  const fetchData = useCallback(async (page, currentFilters, isLoadMore = false) => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) { window.location.href = "/login"; return; }
    const config = { headers: { "x-auth-token": token } };

    try {
        if (monitoredAirports.length === 0) {
            const airportsRes = await axios.get(`${API_URL}/api/airports`, config);
            setMonitoredAirports(airportsRes.data);
            if (airportsRes.data.length === 0) { setLoading(false); return; }
        }
        
        const params = new URLSearchParams({ page, limit: 12, ...currentFilters });
        const flightsRes = await axios.get(`${API_URL}/api/flights?${params.toString()}`, config);
        
        if (isLoadMore) { setFlights(prev => [...prev, ...flightsRes.data.flights]); } 
        else { setFlights(flightsRes.data.flights); }

        setPagination({
            currentPage: flightsRes.data.currentPage,
            totalPages: flightsRes.data.totalPages,
            totalFlights: flightsRes.data.totalFlights
        });

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [monitoredAirports.length]);

  useEffect(() => {
    const fetchAirlines = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
            const res = await axios.get(`${API_URL}/api/airlines/available`, { headers: { "x-auth-token": token } });
            setAirlineOptions(res.data);
        } catch (error) { console.error("Failed to fetch airlines", error); }
    };
    fetchAirlines();
  }, []);

  useEffect(() => {
    const currentDebouncedFilters = {
        searchQuery: debouncedSearchQuery, minDelay: debouncedMinDelay, status: filters.status,
        date: filters.date, airline: filters.airline, monitoredAirport: filters.monitoredAirport,
    };
    fetchData(1, currentDebouncedFilters, false);
  }, [ debouncedSearchQuery, debouncedMinDelay, filters.status, filters.date, filters.airline, filters.monitoredAirport, fetchData ]);

  const hasNextPage = pagination.currentPage < pagination.totalPages;

  const loadMore = useCallback(() => {
      const currentFilters = {
          searchQuery: debouncedSearchQuery, minDelay: debouncedMinDelay, status: filters.status,
          date: filters.date, airline: filters.airline, monitoredAirport: filters.monitoredAirport,
      };
      fetchData(pagination.currentPage + 1, currentFilters, true);
  }, [ pagination.currentPage, debouncedSearchQuery, debouncedMinDelay, filters.status, filters.date, filters.airline, filters.monitoredAirport, fetchData ]);

  useInfiniteScroll(loaderRef, loading, hasNextPage, loadMore);

  const formattedAirlineOptions = useMemo(() => 
      airlineOptions.map(a => `${a.name} (${a.code})`), 
  [airlineOptions]);

  const selectedAirlineDisplayValue = useMemo(() => {
      if (!filters.airline) return "";
      const found = airlineOptions.find(a => a.code === filters.airline);
      return found ? `${found.name} (${found.code})` : "";
  }, [filters.airline, airlineOptions]);

  const handleAirlineChange = (selectedValue) => {
      let airlineCode = "";
      if (selectedValue) {
          const match = selectedValue.match(/\(([^)]+)\)$/);
          if (match && match[1]) { airlineCode = match[1]; }
      }
      setFilters(prev => ({ ...prev, airline: airlineCode }));
  };

  const delayedCount = flights.filter(f => f.status === 'Delayed').length;
  const cancelledCount = flights.filter(f => f.status === 'Cancelled').length;

  return (
    <div className="flex flex-col gap-6">
      <Header
        title="Flight Operations Monitor"
        toggleSidebar={toggleSidebar}
        theme={theme}
        toggleTheme={toggleTheme}
        actions={ <SearchBar query={filters.searchQuery} onChange={(value) => setFilters(prev => ({...prev, searchQuery: value}))} /> }
      />
      {monitoredAirports.length === 0 && !loading && flights.length === 0 ? <NoAirportsMessage /> : (
          <>
            <DashboardStats 
                total={pagination.totalFlights} 
                delayed={delayedCount} 
                cancelled={cancelledCount} 
            />
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-secondary rounded-lg shadow-sm p-4">
              <ControlPanel
                  filters={filters}
                  onFilterChange={setFilters}
                  monitoredAirportOptions={monitoredAirports}
              />
              <button onClick={() => setShowAdvancedFilters(prev => !prev)} className={`flex-shrink-0 w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${showAdvancedFilters ? 'bg-accent text-white' : 'bg-primary text-text-secondary'}`}>
                  <FaFilter /> <span>Advanced</span>
              </button>
            </div>
            
            {/* ✅ ==== التعديل الرئيسي هنا ==== */}
            {/* إضافة `relative` و `z-20` لرفع مستوى هذه الحاوية */}
            <div className="relative z-20">
              <AnimatePresence>
                  {showAdvancedFilters && (
                      <AdvancedFilters 
                          filters={filters} 
                          onFilterChange={setFilters} 
                          airlineOptions={formattedAirlineOptions}
                          onAirlineChange={handleAirlineChange}
                          selectedAirlineValue={selectedAirlineDisplayValue}
                      />
                  )}
              </AnimatePresence>
            </div>

            <FlightGrid flights={flights} loading={loading && flights.length === 0} monitoredAirports={monitoredAirports} />
            
            <div ref={loaderRef} className="col-span-full h-10 flex items-center justify-center text-text-secondary">
                {loading && flights.length > 0 && <p>Loading more flights...</p>}
                {!loading && !hasNextPage && flights.length > 0 && <p>You have reached the end.</p>}
            </div>
          </>
        )
      }
    </div>
  );
};

export default FlightDashboard;